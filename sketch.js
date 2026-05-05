let capture;
let faceMesh;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏預設產生的 HTML 影片標籤

  // 初始化 FaceMesh 模型
  if (typeof ml5 !== 'undefined') {
    faceMesh = ml5.faceMesh(capture, options, modelLoaded);
  } else {
    console.error("錯誤：無法偵測到 ml5 程式庫。請檢查你的網路連線，或確認 index.html 中的 <script> 標籤是否正確載入。");
    alert("ml5.js 載入失敗，請檢查網路連線或重新整理頁面。");
  }
}

function modelLoaded() {
  // 開始持續偵測
  faceMesh.detectStart(capture, gotFaces);
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background('#e7c6ff');

  // 計算影像寬高為畫布的 50%
  let w = width * 0.5;
  let h = height * 0.5;

  // 顯示文字資訊
  fill(0); // 設定文字為黑色
  textSize(32); // 設定文字大小
  textAlign(CENTER, BOTTOM); // 水平置中，垂直對齊底部
  text("教育科技系 414730878  高翊嘉", width / 2, (height - h) / 2 - 10);

  // 處理左右顛倒（鏡像效果）並將影像繪製在畫布中間
  push();
  translate(width, 0); // 將座標系統移動到畫布右側
  scale(-1, 1);        // 水平翻轉座標軸
  
  let imgX = (width - w) / 2;
  let imgY = (height - h) / 2;
  
  // 繪製影像
  image(capture, imgX, imgY, w, h);

  if (faces.length > 0) {
    let face = faces[0];
    
    // --- 繪製遮罩：讓臉部以外的區域變成 #fdf0d5 ---
    fill('#fdf0d5');
    noStroke();
    beginShape();
    // 外部大矩形（覆蓋整個畫布）
    vertex(0, 0);
    vertex(width, 0);
    vertex(width, height);
    vertex(0, height);
    
    // 內部孔洞（臉部輪廓，逆時針繪製以產生挖空效果）
    let faceOutline = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
    beginContour();
    for (let i = faceOutline.length - 1; i >= 0; i--) {
      let p = face.keypoints[faceOutline[i]];
      let x = map(p.x, 0, capture.width, imgX, imgX + w);
      let y = map(p.y, 0, capture.height, imgY, imgY + h);
      vertex(x, y);
    }
    endContour();
    endShape(CLOSE);

    // 1. 嘴唇部分 (紅色, 粗細 1)
    stroke(255, 0, 0);
    strokeWeight(1);
    noFill();
    let lip1 = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
    let lip2 = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];
    drawConnectors(face, lip1, imgX, imgY, w, h, false);
    drawConnectors(face, lip2, imgX, imgY, w, h, false);

    // 2. 右眼部分
    let rightEyeOuter = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
    let rightEyeInner = [130, 247, 30, 29, 28, 27, 26, 25, 24, 23, 22, 110, 112, 243, 190, 56];
    stroke(50); strokeWeight(15); // 黑眼圈：灰色偏黑，粗細 15
    drawConnectors(face, rightEyeOuter, imgX, imgY, w, h, true);
    stroke(255, 0, 0); strokeWeight(1); // 內圈：紅色，粗細 1
    drawConnectors(face, rightEyeInner, imgX, imgY, w, h, true);

    // 3. 左眼部分
    let leftEyeOuter = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];
    let leftEyeInner = [463, 341, 339, 252, 253, 254, 255, 256, 257, 258, 259, 260, 467];
    stroke(50); strokeWeight(15); // 黑眼圈：灰色偏黑，粗細 15
    drawConnectors(face, leftEyeOuter, imgX, imgY, w, h, true);
    stroke(255, 0, 0); strokeWeight(1); // 內圈：紅色，粗細 1
    drawConnectors(face, leftEyeInner, imgX, imgY, w, h, true);

    // 4. 臉部外輪廓 (螢光藍色, 粗細 2)
    stroke(0, 255, 255);
    strokeWeight(2);
    drawConnectors(face, faceOutline, imgX, imgY, w, h, true);
  }
  pop();
}

// 輔助函式：繪製特徵點連線
function drawConnectors(face, indices, imgX, imgY, w, h, isClosed) {
  for (let i = 0; i < indices.length; i++) {
    let nextIndex = i + 1;
    if (nextIndex >= indices.length) {
      if (isClosed) nextIndex = 0; // 如果需要閉合，則連回第一個點
      else break;
    }

    let p1 = face.keypoints[indices[i]];
    let p2 = face.keypoints[indices[nextIndex]];

    if (p1 && p2) {
      let x1 = map(p1.x, 0, capture.width, imgX, imgX + w);
      let y1 = map(p1.y, 0, capture.height, imgY, imgY + h);
      let x2 = map(p2.x, 0, capture.width, imgX, imgX + w);
      let y2 = map(p2.y, 0, capture.height, imgY, imgY + h);
      line(x1, y1, x2, y2);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
