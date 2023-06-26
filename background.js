browser.menus.create({
  id: "download",
  title: "Download as cbz",
  contexts: ["image"]
});

const createPluginCode = (targetElementId) => {
    return `
        (() => {
            const MIN_IMAGES_THRESHOLD = 5

            const getParentContainer = (startElement) => {
                let currentElement = startElement

                while(currentElement) {
                    if(currentElement.querySelectorAll("img").length >= MIN_IMAGES_THRESHOLD) {
                        return currentElement
                    }

                    currentElement = currentElement.parentElement
                }

                return null
            }

            const convertImageToBase64 = (imgElement) => {
                  const canvas = document.createElement('canvas')
                  const ctx = canvas.getContext('2d')

                  canvas.width = imgElement.width
                  canvas.height = imgElement.height

                  ctx.drawImage(imgElement, 0, 0)

                  return canvas.toDataURL('image/jpeg')
            }

            const imageUrlToBase64 = (url) => {
              return fetch(url)
                .then(response => response.blob())
                .then(blob => {
                  return new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result)
                    reader.onerror = reject
                    reader.readAsDataURL(blob)
                  })
                })
            }

            const dataUrlToBase64 = (dataUrl) => {
                return dataUrl.split(',')[1];
            }

            const addPaddingZeros = (number, numElements) => {
                let numberStr = String(number)

                if (numberStr.length < numElements) {
                    let paddingZeros = '0'.repeat(numElements - numberStr.length);
                    return paddingZeros + numberStr
                }

                return numberStr
            }

            const addImageToZipAsync = (filename, url, zip) => {
                return new Promise((resolve, reject) => {
                    try { 
                        imageUrlToBase64(url).then((data) => {
                            zip.file(filename, dataUrlToBase64(data), { base64: true })

                            resolve()
                        })
                    } catch(error) {
                        reject(error)
                    }
                })
            }

            const createZipFileFromImages = (imgElements) => {
                return new Promise((resolve, reject) => {
                    try {
                        const zip = new JSZip()

                        const promises = [...imgElements].map((el, index) => {
                            const filename = addPaddingZeros(index, String(imgElements.length).length) + ".jpg"

                            return addImageToZipAsync(filename, el.src, zip)
                        })

                        Promise.all(promises).then(() => {
                            resolve(zip.generateAsync({ type: "blob" }))
                        })
                    } catch(error) {
                        reject(error)
                    }
                })
            }

            const extractChapterName = () => {
                const matches = document.body.innerText.match(/chapter\\s*([0-9]+(\\.[0-9]+)?)/ig)

                return (matches && matches[0]) || ""
            }

            const getChapterName = () => {
                const name = extractChapterName()

                return name.toLowerCase().split(" ").join("_")
            }

            const exportPageAsCbz = () => {
                const imgElement = browser.menus.getTargetElement(${targetElementId})
                const parentContainer = getParentContainer(imgElement)

                if(!parentContainer) return

                const imgElements = parentContainer.querySelectorAll("img")

                createZipFileFromImages(imgElements)
                .then(function(content) {
                    saveAs(content, (getChapterName() || (new Date().getTime())) + ".cbz")
                })
            }

            exportPageAsCbz()
        })()
    `
}

browser.menus.onClicked.addListener((info, tab) => {
    browser.tabs.executeScript(tab.id, {
        frameId: info.frameId,
        code: createPluginCode(info.targetElementId)
    })
});
