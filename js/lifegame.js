//window.addEventListener('load', init(30,30), false);

init(30,30);

function init(m,n){
  // 横方向の配列作って、
  var la = new Array();
  // 縦方向に配列を追加する
  for(i=0;i<m+2;i++){
    la[i] = new Array();
    for(j=0;j<n+2;j++){
      la[i][j] = Math.floor(Math.random()*2);
    }
  }

  DrawProc(la,m,n);
}

function DrawProc(la,m,n)
{
  CopyBuff(la,m,n);
  DeadOrAlive(la,m,n);
  draw(la,m,n);
  setTimeout(DrawProc, 100,la,m,n);
}

function CopyBuff(la,m,n)
{
  // 上下をコピー
  for(i=1;i<m+1;i++){
    la[i][0]   = la[i][n];
    la[i][n+1] = la[i][1];
  }
  // 左右をコピー
  for(j=1;j<n+1;j++){
    la[0  ][j]   = la[m][j];
    la[m+1][j] = la[1][j];
  }
  // 四隅をコピー
  la[  0][  0] = la[m][n];
  la[m+1][n+1] = la[1][1];
  la[  0][n+1] = la[m][1];
  la[m+1][  0] = la[1][n];
}

function DeadOrAlive(la,m,n)
{
  // la から lbにコピー
  var lb = new Array();
  for(i=0;i<m+2;i++){
    lb[i] = new Array();
    for(j=0;j<n+2;j++){
      lb[i][j] = la[i][j];
    }
  }

  // lb を評価しながらla に設定
  for(i=1;i<m+1;i++){
    for(j=1;j<n+1;j++){
      var cnt = lb[i-1][j-1]+lb[i][j-1]+lb[i+1][j-1]
              + lb[i-1][j  ]           +lb[i+1][j  ]
              + lb[i-1][j+1]+lb[i][j+1]+lb[i+1][j+1];

      if(lb[i][j]==1&&(cnt==2||cnt==3)){
        // 生きててカウントが2か3
        // そのまま生きる
      }else if(lb[i][j]==0&&cnt==2){
        // そのまま死んどく
      }else if(lb[i][j]==0&&cnt==3){
        // 生まれる
        la[i][j] = 1;
      }else{
        // それ以外は死
        la[i][j] = 0;
      }
    }
  }
}

function draw(la,m,n){
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  

  for(i=0;i<m;i++){
    for(j=0;j<n;j++){
      if (la[i+1][j+1]==1){
        ctx.fillStyle = "white";
        ctx.fillRect(i*10, j*10, 10, 10);
      }else{
        ctx.fillStyle = "gray";
        ctx.fillRect(i*10, j*10, 10, 10);
        ctx.strokeStyle = "white";
        ctx.strokeRect(i*10, j*10, 10, 10);
      }
    }
  }
}
