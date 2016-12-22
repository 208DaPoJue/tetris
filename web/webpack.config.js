// phaser bug https://github.com/photonstorm/phaser/issues/1974 so don't include phaser

module.exports = {
    output: {
        filename: "bundle.js",
        //path: __dirname + "/dist"
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    debug: true,

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    },

    module: {
        loaders: [
            { test: /\.tsx?$/, loader: "ts-loader" },
        ],

        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    },

};