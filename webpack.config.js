const HtmlWebpackPlugin = require('html-webpack-plugin');
const { join, resolve } = require('path');

const srcPath = resolve(__dirname, 'src');
const buildPath = resolve(__dirname, 'build');
const entry = join(srcPath, 'renderer.tsx');

module.exports = {
    mode: "development",
    entry,
    target: "electron-renderer",
    devtool: "eval-cheap-module-source-map",
    devServer: {
        contentBase: join(buildPath, "renderer.js"),
        port: 3000,
    },
    resolve: {
        alias: {
            "~": srcPath,
        },
        extensions: [".tsx", ".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.(eot|ttf|woff)$/,
                type: "asset/resource",
            },
            {
                test: /\.tsx?$/,
                include: srcPath,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
            {
                test: /\.s[ac]ss$/i,
                use: ["style-loader", "css-loader", "sass-loader"],
            },
        ],
    },
    output: {
        path: buildPath,
        filename: "renderer.js",
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: join(srcPath, "index.html"),
        }),
    ],
};
