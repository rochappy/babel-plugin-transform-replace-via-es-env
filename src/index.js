const _ = require('lodash');
const babel = require('@babel/core');
const generate = require('@babel/generator').default;

const envTmpl = `
if (process.env.NODE_ENV !== 'production') {
    <%= original %>
} else {
    <%= transform %>
}
`;

module.exports = () => {
    return {
        name: "transform-replace-via-es-env",
        visitor: {
            ExpressionStatement(path, state) {
                const { expression } = path.node;
                if (path.parent.type === 'Program' &&
                    _.get(expression, 'callee.object.name') === 'via' &&
                    _.get(expression, 'callee.property.name') === 'register'
                ) {
                    const transform = babel.transform(generate(path.node).code, {
                        plugins: ['transform-remove-via-props'],
                    }).code;

                    const original = generate(path.node).code;

                    const replaceWith = babel.parse(_.template(envTmpl)({
                        original,
                        transform,
                    }));

                    path.replaceWith(replaceWith);
                }
            },
        }
    }
};