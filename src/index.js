const { Command } = require("@oclif/command");
const convert = require("xml-js");
const fs = require("fs");
const svgpath = require("svgpath");
const getBounds = require("svg-path-bounds");

class SvgToJsonCommand extends Command {
  xmlToJson(path) {
    return convert.xml2json(fs.readFileSync(path, "utf8"), {
      compact: true,
      spaces: 4,
    });
  }

  cleanUpPaths(pathsObj) {
    const paths = pathsObj.map(
      ({
        _attributes: { id },
        path: {
          _attributes: { d },
        },
      }) => {
        const parsed = svgpath(d);

        const convertedPath = parsed.scale(1).abs().toString();
        const [height, width] = getBounds(convertedPath).reverse();

        return {
          [id.toString()]: {
            d: convertedPath,
            bounds: {
              width,
              height,
            },
          },
        };
      }
    );

    return Object.assign({}, ...paths);
  }

  writeAFile(inputName, json) {
    const targetName = `${inputName.split(".").slice(0, -1).join(".")}.json`;

    fs.writeFileSync(targetName, JSON.stringify(json, null, 4));
  }

  async run() {
    const {
      args: { file },
    } = this.parse(SvgToJsonCommand);

    if (!file) this.error("Need a file");

    const svgJson = this.xmlToJson(file);

    this.writeAFile(file, this.cleanUpPaths(JSON.parse(svgJson).svg.symbol));

    this.log("JSON created");
  }
}

SvgToJsonCommand.args = [
  {
    name: "file",
  },
];

module.exports = SvgToJsonCommand;
