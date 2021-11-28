import path from 'path';
import fs from 'fs';
import process from 'process'
import beautify from 'json-beautify';


const getVitePlugin = () => {
  return {
    name: 'my-plugin', // 必须的，将会在 warning 和 error 中显示
    buildStart() {
      console.log('my-plugin buildStart !!!!!!!!!!!!!!!!!!');
      // fs.writeFileSync(path.join(__dirname,'server','server.js'), '')
    },

    watchChange() {
      console.log('my-plugin watchChange !!!!!!!!!!')

    },
    transform(code, id) {
      const cwd = process.cwd();
      // 查看是否是src目录下的文件
      if (path.join(id).indexOf(path.join(cwd, 'src')) === 0) {
        if (['.js', '.vue'].indexOf(path.extname(id)) > -1) {

          const relativePath = path.relative(path.join(cwd, 'src'), id);
          const folderPath = path.join(cwd, 'server', path.dirname(relativePath))
          const filePath = path.join(cwd, 'server', relativePath)

          console.log('trf:  ', relativePath)
          console.log('fol:  ', folderPath)

          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
          }
          fs.writeFileSync(filePath, code)
          // server(filePath + '.js',code)
          // console.log(filePath+ '.js');


          // fs.writeFileSync(filePath + '.js',blocks.join('\n\n'),'utf8')

          // append id to file
          // fs.appendFileSync(path.join(__dirname,'server','server.js'), 
          //   `require('${id}.js')\n`
          // )
          // console.log('rel:', path.relative(path.join(__dirname),id))

          // console.log('\n');


        }

      }


      return code

    }
  }
}


export default {
  getVitePlugin
}