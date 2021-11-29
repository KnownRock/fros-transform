const babel = require('@babel/core');

const { default: sha256 } = require('fast-sha256');
const { default: generate } = require("babel-generator");

const globals = require('globals');

const t = require('babel-types');

const packageName = 'fros'

const transform = (code, cb) => {

  let fucName = ''
  const fucs = {}
  const outerVariables = []
  const dependencies = []
  const dependenciesPathToPackageName = {}


  const collectInfoVisitors = {
    // collect all package names 
    ImportDeclaration(path) {
      const { node } = path
      const { source } = node
      node.specifiers.forEach(specifier => {
        const { local } = specifier
        const { name } = local
        dependenciesPathToPackageName[name] = source.value

        if (source.value === packageName) {
          fucName = name
        }
      })
    },

    // collect all variables outside of the function
    CallExpression(path) {
      // in the target function, collect all variables
      if (path.node.callee.name == fucName) {
        const fucBody = generate(path.node.arguments[0]).code;
        const hash = Buffer.from(sha256(fucBody)).toString('hex');
        fucs[hash] = fucBody

        const p2 = path
        path.traverse({
          FunctionExpression(path) {
            if (path.node === p2.node.arguments[0]) {
              // collect all dependencies in server side code
              path.traverse({
                CallExpression(path) {
                  if (path.node.callee.name == 'require' || path.node.callee.type == 'Import') {
                    dependencies.push(path.node.arguments[0].value);
                  }
                }
              })

              // collect all variables which defined in client side code
              const p3 = path
              path.traverse({
                Identifier(path) {
                  // FIXME: should handle spread expression 
                  if (globals.node.hasOwnProperty(path.node.name)) return

                  if (!p3.scope.hasOwnBinding(path.node.name) && path.key !== 'property') {
                    outerVariables.push(path.node.name);
                  }
                }
              })
            }

          }
        })

        cb(path, {
          fucs,
          outerVariables,
          dependencies,
          dependenciesPathToPackageName,
          hash
        })

      }
    }
  }


  const result = babel.transform(code, {
    plugins: [{
      visitor: collectInfoVisitors,
    }]
  });

  return result.code
}

const getClientCode = (code) => {
  const result = transform(code, (path, {
    fucs,
    dependencies,
    outerVariables,
    dependenciesPathToPackageName,
    hash
  }) => {
    path.node.arguments[0] = t.stringLiteral(hash)
    path.node.arguments[1] = t.objectExpression(
      outerVariables
        // filter all variables which is imported
        // .filter(d=>!dependenciesPathToPackageName[d])

        .map(d => t.objectProperty(t.identifier(d), t.identifier(d)))
    )

    console.log(fucs);
    console.log(dependencies);
    console.log(outerVariables);
    console.log(dependenciesPathToPackageName);
  })

  return result
}

const getServerCodeMeta = (code, {
  calleeName = 'frosServer'
} = {}) => {
  const serverCodes = []
  let serverDependencies = {}

  transform(code, (path, {
    fucs,
    dependencies,
    outerVariables,
    dependenciesPathToPackageName,
    hash
  }) => {
    console.log(dependencies);

    path.node.callee.name = calleeName
    path.node.arguments[1] = path.node.arguments[0]
    path.node.arguments[0] = t.stringLiteral(hash)

    // path.node.arguments[1].params = path.node.arguments[1].params.concat(
    //   t.Identifier('req')
    // )

    let contextName = '__fros__context'
    const contextReqName = 'frosReq'
    const reqName = '__fros__req'
    if (path.node.arguments[1].params[0]?.name) {
      contextName = path.node.arguments[1].params[0].name
    }else{
      path.node.arguments[1].params[0] = t.identifier(contextName)
    }


    outerVariables.length && path.node.arguments[1].body.body.unshift(
      t.variableDeclaration('const',
        [t.variableDeclarator(t.identifier(reqName), t.identifier(`${contextName}.${reqName}`))].concat(
          outerVariables.map(ov =>
            t.variableDeclarator(t.identifier(ov), t.identifier(`${reqName}.${ov}`))
          )
        )
      )
    )
    serverDependencies = {
      ...serverDependencies,
      ...dependencies.reduce((acc, name) => {
        acc[name] = `${name}`
        return acc
      }, {})
    }


    serverCodes.push(path.toString())
  })

  return {
    serverCodes,
    serverDependencies: Object.keys(serverDependencies)
  }

}


module.exports.getServerCodeMeta = getServerCodeMeta
module.exports.getClientCode = getClientCode