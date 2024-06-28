

class Sprite {
    TagNames = [];              // 複数のTagを初期設定可能
    currentFrameTagNum = 0;    // currentFrameTagnamesの現在のタグ番号
    currentFrameTagFrom = -1;   // frameTagのFrom
    currentFrameTagTo = -1;     // frameTagのTo
    currentFrame = -1;          // framesのフレーム番号
    xPos;
    yPos;
    vx;
    vy;
    jsonData;
    spriteName = "";
    image;
    static ImageDic = [];
    childs = [];
    physics = [];
    followParent = true;   // 親についていくかどうか

    appendChild(sprite) {
        this.childs.push(sprite)
    }

    addPhysic(fn) {
        this.physics.push(fn);
    }

    isPhysic(fn) {
        for (var i = 0; i < this.physics.length; i++) {
            if (fn === this.physics[i]) {
                return true
            }
        }
        return false
    }

    setTag(TagName) {
        if (this.jsonData != null) {
            var tag = this.jsonData.meta.frameTags.filter(function (item) {
                if (item.name == TagName) {
                    return item;
                }
            })
            this.currentFrameTagFrom = tag[0].from;
            this.currentFrameTagTo = tag[0].to;
            this.currentFrame = this.currentFrameTagFrom;   // 初期値
            
        }
        this.frameCount = 0;
    }

    constructor(name, jsonData, TagNames, x = 0, y = 0, vx = 0, vy = 0) {
        this.spriteName = name;
        this.jsonData = jsonData;
        this.TagNames = TagNames;
        this.xPos = x;
        this.yPos = y;
        this.vx = vx;
        this.vy = vy;

        this.setTag(TagNames[0]);
    }

    static async build(name, jsonData, frameTagNames, x = 0, y = 0, vx = 0, vy = 0) {
        const sprite = new Sprite(name, jsonData, frameTagNames, x, y, vx, vy);
        if (this.ImageDic[name] === undefined) {
            const img = new Image();
            img.src = "images/" + sprite.jsonData.meta.image;  // asepriteのJSONをわりつける
            await img.decode();
            // await 以降はイメージが使えるので、ちゃんと情報も表示できる
            console.log(`loaded pic ! width: ${img.width}, height: ${img.height}`);
            this.ImageDic[name] = img;
        }
        sprite.image = this.ImageDic[name];

        return sprite;
    }

    draw(ctx, parent) {
        if (this.jsonData != null) {
            //        console.log("Sprite::draw");
            var f = this.jsonData.frames[this.currentFrame];
            // フレーム換算（asepriteは1/1000、しかしブラウザは1/60なので換算する）
            if (f.duration / 1000 * 60 < this.frameCount) {
                // 次のフレームへ
                if (this.currentFrame == this.currentFrameTagTo) {
                    if (this.currentFrameTagNum < this.TagNames.length - 1){
                        this.currentFrameTagNum ++;
                        this.setTag(this.TagNames[this.currentFrameTagNum])
                    }else{
                        this.currentFrame = this.currentFrameTagFrom;
                    }
                } else {
                    this.currentFrame += 1;
                }
                // あらためて現在のフレームをセット
                f = this.jsonData.frames[this.currentFrame];
                // フレームカウントを初期化
                this.frameCount = 0;
            }
            // 自分が親なら自分の位置に表示
            var dispX = -1;
            var dispY = -1;
            var baseX = -1;
            var baseY = -1;

            // スプライトの左右中央＋下端に表示する場合の計算←今後起点をどこにするかの対応も必要となる
            if (true) {
                baseX = f.spriteSourceSize.x - f.sourceSize.w / 2;
                baseY = f.spriteSourceSize.y - f.sourceSize.h;
            }

            dispX = this.xPos + baseX;
            dispY = this.yPos + baseY;

            if (parent != null && followParent == true) {
                // 親がいて、親についていく場合、親の相対位置へ表示する
                dispX += parent.xPos;
                dispY += parent.yPos;
            }
            ctx.drawImage(this.image,
                f.frame.x,      // sx      (元画像の切り抜き始点X)
                f.frame.y,      // sy      (元画像の切り抜き始点Y)
                f.frame.w,      // sWidth  (元画像の切り抜きサイズ：幅)
                f.frame.h,      // sHeight (元画像の切り抜きサイズ：高)
                dispX,          // dx
                dispY,          // dy
                f.frame.w,      // 圧縮幅
                f.frame.h       // 圧縮高
            );

            // Debug:当たり判定を矩形でくくる（当たり判定も起点によって変わる）
            ctx.beginPath();
            ctx.rect(this.xPos - f.frame.w / 2, this.yPos - f.frame.h, f.frame.w, f.frame.h);
            ctx.stroke();
            ctx.fillStyle = "red";
            ctx.fillRect(this.xPos - 1, this.yPos, 2, 2);
            ctx.stroke();

            // 子供がいたら表示する
            for (var i = 0; i < this.childs.length; i++) {
                this.childs[i].draw(ctx, this);
            }
        }

        // 表示をしたのちに、次のフレームの位置を計算しておく
        if (this.physics.length > 0) {
            var i = 0;
            do {
                this.physics[i](this);
                i++;
            } while (i < this.physics.length)
        }

        // フレームをインクリメントする
        this.frameCount += 1;
        // true：次のフレームも生存 false:次のフレームでは消える
        return true;
    }
}

class Primitive {
    primitives = [];
    context = null;
    isRunning = false;
    loopCount = 0;
    ClickedX = -1;
    ClickedY = -1;

    OnClick(e) {
        var rect = e.target.getBoundingClientRect();
        this.ClickedX = e.clientX - rect.left;
        this.ClickedY = e.clientY - rect.top;

        this.context.beginPath();
        this.context.arc(this.ClickedX, this.ClickedY, 32, 0, 2 * Math.PI);
        this.context.stroke();
        console.log("clicked", this.ClickedX, this.ClickedY);
    }
    constructor(context) {
        console.log("constructor");
        this.context = context;
        console.log("canvas Size = (" + this.context.canvas.width + "," + this.context.canvas.height + ")");
        this.context.canvas.addEventListener('click', this.OnClick.bind(this), false);
    }

    loop() {
        this.loopCount++;

        var i = 0;
        do {
            if (this.primitives[i].draw(this.context, null) != true) {
                this.primitives.slice(i, 1); // 消す
            } else {
                i++;
            }
        } while (i < this.primitives.length);

        if (this.isRunning) {
            window.requestAnimationFrame(this.loop.bind(this));
        }
    }

    stop() {
        console.log("Primitive::stop");
        this.isRunning = false;
    }

    run() {
        // 二重に起動しない
        if (this.isRunning == false) {
            var self = this;
            console.log("Primitive::run");
            this.isRunning = true;
            window.requestAnimationFrame(this.loop.bind(this));
        }
    }

    append(prim) {
        this.primitives.push(prim)
    }
}