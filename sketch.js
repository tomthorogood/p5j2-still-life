// include p5.js

let config = null;
let generating = false;

class GeneratedValue {
    constructor(generator_) {
        this.generator = generator_;
        this.value = null;
    }

    getValue() {
        if (!this.value) {
            this.value = this.generator();
        }
        return this.value;
    }
}


class PatternConfig {
    constructor() {
        let self = this;
        this.patterns = [
            {
                name: 'polkadots',
                defaultWidth: 50,
                defaultHeight: 50,
                defaultShade: new GeneratedValue(getRandomColor),
                generator: function(image, startX = 0, startY = 0, options = null) {
                    let width = this.defaultWidth;
                    let height = this.defaultHeight;
                    let posX = startX;
                    let posY = startY;
                    while (posY < image.height) {
                        while (posX < image.width) {
                            let dotColor = getRandomPaletteColor(this.defaultShade.getValue());
                            dotColor.setAlpha(185);
                            posX += width;
                            image.push();
                            image.fill(dotColor);
                            image.noStroke();
                            image.ellipse(posX, posY, width, height);
                            image.pop();
                        }
                        posX = 0;
                        posY += height;
                    }
                }
            }
        ]
    }
}


class WallpaperConfig {
    constructor(config) {
        let self = this;
        this.config = config;
        this.tileSize = random(15, 60);
        this.passes = random(3, 12);
        this.baseColor = self.config.palette.gradientStart.getValue();
        this.secondaryColor = self.config.palette.gradientStop.getValue();
        this.patterns = [
            {
                name: 'squareWorms',
                generator: function (startX, startY) {
                    let strokeColor = lerpColor(
                        self.baseColor,
                        self.secondaryColor,
                        random(0.1, 0.9)
                    )
                    let tileSize = max(self.tileSize + random(-10, 10), 10);
                    push();
                    stroke(strokeColor)
                    strokeWeight(3);
                    let stop1 = tileSize * .6;
                    let stop2 = tileSize * .4;
                    let stop3 = tileSize;

                    maybe(function () {
                        line(startX, startY + stop1, startX + stop1, startY + stop1)
                    });
                    maybe(function () {
                        line(startX + stop1, startY + stop1, startX + stop1, startY)
                    });
                    maybe(function () {
                        line(startX + stop2, startY + stop2, startX + stop2, startY + stop3)
                    });
                    maybe(function () {
                        line(startX + stop2, startY + stop2, startX + stop3, startY + stop2)
                    });
                    maybe(function () {
                        line(startX + stop3, startY + stop2, startX + stop3, startY + stop1)
                    });
                    maybe(function () {
                        line(startX + stop2, startY + stop3, startX + stop1, startY + stop3)
                    });
                    pop();
                }
            },
            {
                name: 'stucco',
                generator: function(startX, startY) {
                    push();
                    for (let i = 0; i < random(10, 50); ++i) {
                        stroke(getRandomPaletteColor());
                        point(random(startX, self.tileSize + startX), random(startY, self.tileSize + startY));
                    }
                    pop();
                }
            }
        ];
    }
}


class Config {
    constructor() {
        const self = this;
        self.canvas = {
            height: 800,
            width: 800
        };

        self.bowl = {
            width: self.canvas.width * 0.375,
            height: self.canvas.height * 0.375
        }

        self.palette = {
            gradientStart: new GeneratedValue(getRandomColor),
            gradientStop: new GeneratedValue(getRandomColor)
        };

        self.wallpaper = new WallpaperConfig(self);
        self.possibleSubjects = [];
    }
}


function getRandomPaletteColor(gradientStop = null) {
    gradientStop ||= config.palette.gradientStop.getValue();
    return lerpColor(
        config.palette.gradientStart.getValue(),
        gradientStop,
        random(0.2, 0.9)
    )
}

function setup() {
    config = new Config();
    createCanvas(config.canvas.width, config.canvas.height);
    angleMode(DEGREES);
    noLoop();
}

function getRandomColor() {
    return color(
        random(0, 255),
        random(0, 255),
        random(0, 255),
    )
}

function maybe(fn) {
    if (random(0, 1) > 0.5) {
        fn();
    }
}

function tileShape(shape) {
    let tileSize = config.wallpaper.tileSize;
    let posX = 0;
    let posY = 0;
    while (posY < height) {
        while (posX < width) {
            shape.generator(posX, posY);
            posX += tileSize;
        }
        posY += tileSize;
        posX = 0;
    }
}

function generateBowlPattern() {
    let p = createGraphics(config.bowl.width, config.bowl.height);
    p.background(getRandomPaletteColor(getRandomColor()));
    let wt = random(10, 55);
    let numDots = random(5, 25);
    p.push();
    p.stroke(getRandomPaletteColor(getRandomColor()));
    p.strokeWeight(wt)
    p.line(0, 0, config.bowl.width, 0);
    p.pop();
    p.push();
    p.strokeWeight(1);
    p.stroke('#000000')
    p.line(1, wt/2, config.bowl.width - 1, wt/2);
    p.pop();
    let pc = new PatternConfig();
    pc.patterns[0].generator(p, -p.width, wt * 2);
    return p;
}

function paintBowl() {
    let bowlStartX = random(width * .25, width * .55);
    let bowlStartY = 500;
    let bowlHeight = 300;
    let bowlWidth = 300;
    let pattern = generateBowlPattern();
    let bowlPattern = createGraphics(bowlWidth, bowlHeight);
    let bowlOutline = createGraphics(bowlWidth, bowlHeight);
    bowlPattern.arc(bowlWidth / 2, 0, bowlWidth, bowlHeight, 0, 180, OPEN);
    bowlOutline.noFill();
    bowlOutline.strokeWeight(1.5)
    bowlOutline.arc(bowlWidth / 2, 0, bowlWidth, bowlHeight, 0, 180, OPEN);
    bowlOutline.line(0, 0, bowlWidth, 0);
    ( pImg = pattern.get() ).mask( bowlPattern.get() );
    image(pImg, bowlStartX, bowlStartY);
    image(bowlOutline, bowlStartX, bowlStartY);
    push();
    pop();
    bowlPattern.remove();
    bowlOutline.remove();
    pattern.remove();
}

function paintTable() {
    push();
    fill(getRandomPaletteColor(getRandomColor()))
    rect(0, 600, width, 300)
    pop();
}

function paintWallpaper() {
    let bgColor = config.wallpaper.baseColor;
    let patterns = config.wallpaper.patterns;
    background(bgColor);

    let shapeIndex = floor(random(0, patterns.length))
    let shape = patterns[shapeIndex]
    for (let i = 0; i < config.wallpaper.passes; ++i) {
        tileShape(shape);
    }
}

function postDraw() {
    const loadingIndicator = document.getElementById('loading');
    const readyIndicator = document.getElementById('ready');
    loadingIndicator.classList.toggle('visible', false);
    loadingIndicator.classList.toggle("invisible", true);
    readyIndicator.classList.toggle('invisible', false);
    readyIndicator.classList.toggle("visible", true);
    let backgroundColor = config.palette.gradientStart.getValue();
    backgroundColor.setAlpha(50);
    document.getElementById('body').style.backgroundColor = backgroundColor.toString();
    backgroundColor.setAlpha(40);
    let canvasElement = document.getElementById('canvas');
    canvasElement.style.backgroundColor = backgroundColor.toString();
    document.getElementById('loading').classList.toggle('d-none');
}

function preDraw() {
    const loadingIndicator = document.getElementById('loading');
    const readyIndicator = document.getElementById('ready');
    loadingIndicator.classList.toggle('invisible', false);
    loadingIndicator.classList.toggle('visible', true);
    readyIndicator.classList.toggle('visible', false);
    readyIndicator.classList.toggle('invisible', true);
}

function draw() {
    if (!generating) {
        preDraw();
        console.log("Generating image using configuration: ")
        console.log(config);
        generating = true;
        let backgroundColor = config.palette.gradientStart.getValue();
        paintWallpaper();
        paintTable(backgroundColor);
        paintBowl(backgroundColor);
    }
    generating = false;
    console.log("Generation complete.");
    postDraw();
}

function mouseClicked() {
    if (!generating) {
        document.getElementById('loading').classList.toggle('d-none');
        config = new Config();
        redraw();
        document.getElementById('loading').classList.toggle('d-none');
    }
}
