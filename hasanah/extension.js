const vscode = require('vscode')
const { printRandomHadith } = require('./hadith')
const { getAyahText, getSpecificAyah } = require('./quraan')
const { get_hijri_Date } = require('./islamicDate.js')

let timerId

const DEFAULT_DUAA = 'اللهم احفظ السودان واهله ❤️ سبحان الله وبحمده '

async function getText(showHadith) {
  try {
    let text
    if (showHadith) {
      const hadith = await printRandomHadith()
      if (hadith && hadith.arab && hadith.book) {
        text = `${hadith.arab} 💚 book (${hadith.book})`
      }
    } else {
      const ayah = await getAyahText()
      if (
        ayah &&
        ayah.text &&
        ayah.surah &&
        ayah.surah.name &&
        ayah.numberInSurah
      ) {
        text = `${ayah.text} ❤️ ${ayah.surah.name} (${ayah.numberInSurah})`
      }
    }
    if (!text) {
      throw new Error('Failed to fetch text ', showHadith)
    }
    return text
  } catch (error) {
    console.log(error)
    return DEFAULT_DUAA
  }
}

function activate(context) {
  let config = vscode.workspace.getConfiguration('hasanah')
  let delay = config.get('delay') * 60000 // convert from milliseconds

  let showHadith = false

  const showText = async () => {
    const text = await getText(showHadith)
    vscode.window.showInformationMessage(text)
    showHadith = !showHadith
  }

  let timerId = setInterval(showText, delay)

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('hasanah.delay')) {
        clearInterval(timerId) // Clear the old interval

        config = vscode.workspace.getConfiguration('hasanah')
        delay = config.get('delay') * 60000 // Get the new delay

        timerId = setInterval(showText, delay) // Create a new interval with the new delay
      }
    })
  )

  let disposable = vscode.commands.registerCommand(
    'hasanah.getAyah',
    async function () {
      const surah = await vscode.window.showInputBox({
        prompt: 'Enter the number of the surah'
      })
      const ayah = await vscode.window.showInputBox({
        prompt: 'Enter the number of the ayah'
      })

      if (!surah || !ayah) {
        vscode.window.showInformationMessage(
          'Invalid input. Please enter a number.'
        )
        return
      }

      try {
        const data = await getSpecificAyah(surah, ayah)
        if (data) {
          vscode.window.showInformationMessage(
            `${data.text} 💙 ${data.surah.name} (${data.numberInSurah})`
          )
        } else {
          vscode.window.showInformationMessage(
            'No data returned from the Quraan API.'
          )
        }
      } catch (error) {
        console.log(error.message)
        vscode.window.showInformationMessage(
          ` ${DEFAULT_DUAA} (invalid surah/Ayah reference or Internet problem)`
        )
      }
    }
  )
  vscode.commands.registerCommand('hasanah.getHijriDate', async () => {
    try {
      const hejri_date = await get_hijri_Date()
      vscode.window.showInformationMessage(`Today in Hijri is: ${hejri_date}`)
    } catch (e) {
      console.log('An error occurred:', e.message)
    }
  })
  context.subscriptions.push(disposable)
}

function deactivate() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

module.exports = {
  activate,
  deactivate
}
