module.exports = {
    output: {
        filename: 'app.js'
    },
    devtool: 'eval',
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['env'],
                    plugins: [
                        'transform-runtime'
                    ]
                }
            }
        ]
    }
}