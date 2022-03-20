// include p5.js

let config = null;
let generating = false;

class Layer {
    constructor(name, width = 0, height = 0, paintFn)  {
        this.width = width;
        this.height = height;
        this.name = name;
        this.paintFn = paintFn;
        this.pg = createGraphics(width, height);
    }

    draw() {
        // Draws this layer onto the provided layer
        if (this.paintFn) {
            this.paintFn(this.pg);
        }
        return this.pg;
    }

    createGraphics() {
        return createGraphics(this.width, this.height);
    }

    reset() {
        this.clear();
        this.pg = createGraphics(this.width, this.height);
    }

    getMaskedImage(target) {
        let pImg;
        ( pImg = this.pg.get() ).mask( target.get() );
        return pImg;
    }

    clear() {
        this.pg.remove();
    }
}

class OptionsTemplate {
    constructor(options) {
        this.options = options;
    }

    getOptions() {
        let result = {}
        Object.keys(this.options).forEach(key => {
            result[key] = this.options[key]();
        });
        return result;
    }
}


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


class Pattern {
    constructor(name, optionsTemplate) {
        this.optionsTemplate = optionsTemplate;
        this.name = name
    }

    draw(pg, options) { throw Error('Not implemented for pattern ' + this.name) }

    tile(pg, options) {
        if (options === undefined || options === null) {
            console.log("No options passed for pattern " + this.name);
            options = this.optionsTemplate.getOptions();
        }
        while (options.posY < pg.height) {
            while (options.posX < pg.width) {
                this.draw(pg, options);
                options.posX += options.width;
            }
            options.posX = 0;
            options.posY += options.height;
        }
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

class Subject {
    constructor(height, width, layers) {
        this.height = height;
        this.width = width;
        this.layers = layers;
        this.pg = createGraphics(width, height);
    }

    getGraphics() { throw Error('Not implemented'); }

    drawLayers() {
        let layers = this.layers;
        Object.keys(this.layers).forEach(function(k) {
            layers[k].draw();
        })
    }

    cleanup() {
        let layers = this.layers;
        Object.keys(this.layers).forEach(function(k) {
            layers[k].pg.remove();
        })
    }
}

class BowlSubject extends Subject {
    constructor() {
        let size = 300;
        super(size, size, {
                shape: new Layer('Bowl[shape]', size, size, function(pg) {
                    pg.noStroke();
                    pg.fill(getRandomPaletteColor(getRandomColor()));
                    pg.arc(pg.width / 2, 0, pg.width, pg.height, 0, 180, OPEN);
                },),
                pattern: new Layer('Bowl[pattern]', size, size, function(pg) {
                    let patternName = 'polkaDot';
                    let pattern = patterns[patternName];
                    pg.background(getRandomPaletteColor(getRandomColor()));
                    pattern.tile(pg);
                    let weight = 30;
                    pg.strokeWeight(weight);
                    pg.stroke(getRandomPaletteColor(getRandomColor()));
                    pg.line(0, weight * .5, pg.width, weight * .5);
                    pg.strokeWeight(2);
                    let rimShadow = color('#333333');
                    rimShadow.setAlpha(80);
                    pg.stroke(rimShadow);
                    pg.line(0, weight-1, pg.width, weight-1);
                }),
                outline: new Layer('Bowl[outline]', size, size, function(pg) {
                    pg.push();
                    pg.noFill();
                    pg.strokeWeight(1.5);
                    pg.arc(pg.width / 2, 0, pg.width, pg.height, 0, 180, OPEN);
                    pg.line(0, 1, pg.width, 1);
                    pg.pop();
                })
            }
        );
    }

    getGraphics() {
        this.drawLayers();
        let maskedImage = this.layers.pattern.getMaskedImage(this.layers.shape.pg);
        this.pg.image(maskedImage, 0, 0);
        this.pg.image(this.layers.outline.pg, 0, 0);
        this.cleanup();
        return this.pg;
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

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

class PolkaDotPattern extends Pattern {
    constructor() {
        let size = getRandomArbitrary(20, 50);
        super('polkaDot',
            new OptionsTemplate({
                defaultShade: () => getRandomPaletteColor(getRandomColor()),
                height: () => size,
                width: () => size,
                posX: () => 0,
                posY: () => 0
            })
        );
    }

    draw(pg, options) {
        if (options === null) {
            options = this.optionsTemplate.getOptions();
        }

        let dotColor = getRandomPaletteColor(options.defaultShade);
        dotColor.setAlpha(185);
        pg.push();
        pg.fill(dotColor);
        pg.noStroke();
        pg.ellipse(options.posX, options.posY, options.width, options.height);
        pg.pop();
    }
}

let patterns = {
    polkaDot: new PolkaDotPattern()
}


function getRandomColor() {
    return color(
        random(0, 255),
        random(0, 255),
        random(0, 255),
    )
}

function maybe(fn, probability = 0.5) {
    if (random(0, 1) >= probability) {
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

function paintBowl() {
    let bowl = new BowlSubject();
    let bowlShadowWidth = bowl.width * 1.1;
    let bowlShadowHeight = bowl.height / 5;
    let bowlShadow = createGraphics(bowlShadowWidth, bowlShadowHeight);
    let shadowColor = color('#333')

    shadowColor.setAlpha(90);
    bowlShadow.noStroke();
    bowlShadow.fill(shadowColor)
    bowlShadow.ellipse(bowlShadowWidth /2, bowlShadowHeight / 2, bowlShadowWidth, bowlShadowHeight);
    let pg = bowl.getGraphics()
    image(bowlShadow, 125,600);
    image(pg, 250, 500);
    bowlShadow.remove();
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
    let backgroundColor = config.palette.gradientStart.getValue();
    backgroundColor.setAlpha(50);
    document.getElementById('body').style.backgroundColor = backgroundColor.toString();
    backgroundColor.setAlpha(40);
    let canvasElement = document.getElementById('canvas');
    canvasElement.style.backgroundColor = backgroundColor.toString();
}

function draw() {
    if (!generating) {
        generating = true;
        console.log("Generating image using configuration: ")
        console.log(config);
        let backgroundColor = config.palette.gradientStart.getValue();
        paintWallpaper();
        paintTable(backgroundColor);
        paintBowl(backgroundColor);
    }
    generating = false;
    postDraw();
}

function mouseClicked() {
    if (!generating) {
        config = new Config();
        redraw();
    }
}
