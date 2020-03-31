class Analysis {

    constructor({ rekoSvc, translatorSvc, getImageBuffer }) {
      this.rekoSvc = rekoSvc
      this.translatorSvc = translatorSvc
      this.getImageBuffer = getImageBuffer
    }
  
    async detectImageLabels(buffer) {
      const result = await this.rekoSvc.detectLabels({
        Image: {
          Bytes: buffer
        }
      }).promise();
  
      const workingItems = result.Labels.filter(({ Confidence }) => Confidence > 80);
  
      const names = workingItems.map(({ Name }) => Name).join(' and ')
  
      return {
        names,
        workingItems
      }
  
    }
  
  
    async translateText(text, language = 'pt') {
      let params = {
        SourceLanguageCode: 'en',
        TargetLanguageCode: language,
        Text: text
      };
  
      const { TranslatedText } = await this.translatorSvc.translateText(params).promise()
  
      params.Text = 'and';
      const { TranslatedText: splitIn } = await this.translatorSvc
        .translateText(params)
        .promise()
  
      return TranslatedText.split(` ${splitIn} `)
  
    }
  
    async formatTextResults(texts, workingItems, language) {
      const finalText = [];
      const textMiddle = await this.translateText('de ser do tipo', language);
  
      for (const indexText in texts) {
        const nameInTranslate = texts[indexText];
        const confidence = workingItems[indexText].Confidence;
  
        finalText.push(`${confidence.toFixed(2)}% ${textMiddle} ${nameInTranslate}`)
  
      }
  
      return finalText.join('\n');
  
    }
  
  
  
  
  
    async main(event) {
      try {
        const {
          imageUrl,
          language
        } = event.queryStringParameters;
  
        console.log('Donwloading image...')
        const buffer = await this.getImageBuffer(imageUrl)
        console.log('Detecting labels...')
        const { names, workingItems } = await this.detectImageLabels(buffer)
  
        console.log(`Translation to ${language}`)
        const texts = await this.translateText(names, language)
  
        console.log('Handling final object...')
        const finalText = await this.formatTextResults(texts, workingItems, language)
        console.log('Finishing...')
  
        return {
          statusCode: 200,
          body: ` \n `.concat(finalText)
        }
  
  
      } catch (error) {
        console.error('Error:', error.stack)
        return {
          statusCode: 500,
          body: error.stack
        }
      }
    }
  
  }
  

  module.exports = Analysis;