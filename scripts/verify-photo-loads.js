import fs from 'fs';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Step 1: Prove Photo Loads</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #121316; color: #FFFFFF; font-family: sans-serif; }
    .stage {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 55%, #181A20 0%, #111215 70%, #0A0B0D 100%);
      overflow: hidden;
    }
    .art-rectangle {
      position: relative;
      width: 100%;
      height: 100%;
      max-width: 1024px;
      max-height: 682px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .art-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      display: block;
    }
    #debug-info {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.7);
      padding: 12px 16px;
      font-size: 14px;
      font-family: monospace;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.2);
      z-index: 100;
    }
  </style>
</head>
<body>
  <div class="stage">
    <div id="debug-info">Loading...</div>
    <div class="art-rectangle">
      <img id="test-photo" class="art-img" src="../public/assets/arm-photo.png" alt="Arm Photo" />
    </div>
  </div>
  <script>
    const img = document.getElementById('test-photo');
    function report() {
      const computed = window.getComputedStyle(img);
      const info = {
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        clientWidth: img.clientWidth,
        clientHeight: img.clientHeight,
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        filter: computed.filter
      };
      document.getElementById('debug-info').textContent = JSON.stringify(info, null, 2);
    }
    if (img.complete) report();
    else { img.onload = report; img.onerror = () => document.getElementById('debug-info').textContent = 'ERROR LOADING IMAGE'; }
  </script>
</body>
</html>`;

fs.writeFileSync('dist/step1-photo-test.html', html);
console.log('Created dist/step1-photo-test.html');

