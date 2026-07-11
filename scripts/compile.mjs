// سكريبت تجميع العقد الذكي باستخدام solc عبر Node.js
import { createWriteStream, existsSync, readFileSync } from 'fs'
import { get } from 'https'
import { createHash } from 'crypto'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOL_FILE = path.join(ROOT, 'contracts', 'IPRightsRegistry.sol')
const SOLC_PATH = path.join(ROOT, 'scripts', 'solc.exe')

const SOLC_URL = 'https://github.com/ethereum/solc-bin/raw/gh-pages/windows-amd64/solc-windows-amd64-v0.8.20%2Bcommit.a1b79de6.exe'

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) { resolve(); return }
    console.log('جاري تحميل المترجم...')
    const file = createWriteStream(dest)
    get(url, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close()
        download(res.headers.location, dest).then(resolve).catch(reject)
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', reject)
  })
}

async function main() {
  await download(SOLC_URL, SOLC_PATH)

  // تشغيل المترجم
  const output = execSync(
    `"${SOLC_PATH}" --combined-json abi,bin --optimize "${SOL_FILE}"`,
    { encoding: 'utf8' }
  )

  const parsed = JSON.parse(output)
  const key = Object.keys(parsed.contracts).find(k => k.includes('IPRightsRegistry'))
  const { bin } = parsed.contracts[key]

  console.log('\n✅ تم التجميع بنجاح!')
  console.log('\nBYTECODE:')
  console.log('0x' + bin)

  // كتابة الناتج لملف
  import('fs').then(fs => {
    fs.writeFileSync(
      path.join(ROOT, 'scripts', 'bytecode.txt'),
      '0x' + bin
    )
    console.log('\n✅ تم حفظ الـ bytecode في scripts/bytecode.txt')
  })
}

main().catch(e => { console.error('خطأ:', e.message); process.exit(1) })
