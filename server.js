const fs = require('fs');
const { spawn } = require('child_process');
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));
if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');

app.get("/trim", (req, res) => {
  const { url, start, end } = req.query;
  if (!url || start >= end) return res.status(400).send("Invalid request");

  res.setHeader('Content-Disposition', 'attachment; filename="trimmed.mp4"');
  res.setHeader('Content-Type', 'video/mp4');

  const tmpFile = path.join('downloads', `tmp-${Date.now()}.mp4`);

  // yt-dlp partial download + 1080p limit
  const ytdlp = spawn('yt-dlp', [
    url,
    '-f', 'bestvideo[height<=1080]+bestaudio[ext=m4a]/mp4',
    '--merge-output-format', 'mp4',
    '--download-sections', `*${start}-${end}`,
    '-o', tmpFile
  ]);

  // yt-dlp progress
  ytdlp.stderr.on('data', d => {
    const msg = d.toString();
    const match = msg.match(/(\d+\.\d)%/);
    if(match) res.write(`event: progress\ndata: ${match[1]}\n\n`);
  });

  ytdlp.on('close', code => {
    if(code!==0) return res.status(500).send("yt-dlp failed");

    // ffmpeg convert + fragmented MP4 streaming
    const ffmpeg = spawn('ffmpeg', [
      '-i', tmpFile,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+frag_keyframe+empty_moov+default_base_moof',
      '-f', 'mp4',
      'pipe:1'
    ]);

    ffmpeg.stdout.pipe(res);
    ffmpeg.stderr.on('data', d => console.log('ffmpeg:', d.toString()));

    ffmpeg.on('close', () => {
      fs.unlinkSync(tmpFile);
      res.end();
    });
  });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
