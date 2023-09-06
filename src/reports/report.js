const {
  getSupporters,
  getDonationsLength,
  requestExportData,
  retrieveExportDataByUrl,
} = require("../utils/api");

const fs = require("fs");
const ReportCard = require('./ReportCard')

class Report {
  constructor(maxAttempts = 3, reportRetrieveDelay = 10000) {
    this.donationsExports = null
    this.supporters
    this.latestExportDate
    this.maxAttempts = maxAttempts;
    this.reportRetrieveDelay = reportRetrieveDelay;
    this.getReportAttempts = 0
    this.lifetimeReportAll = this.getLifetimeReportOnAllSupporters()
  }

  getDonationsTotal = async() => {
    const donos = await getDonationsLength()
    return donos
  }

  initializeFromLatest = async() => {
    console.log('initializing from API')
    this.latestExportDate = new Date();
    this.donationsExports = await this.getDonationsExports();
    this.supporters = await this.getSupporters();
    const donos = await this.getDonationsTotal();
    this.cacheLatestDonationsToJson()
    this.cacheLatestSupportersToJson()
  }

  initializeFromCached = async() => {
    console.log('initializing from cached')
    const donoFilePath = '../cached/donations/cached_donations.json'
    try {
      const donoJsonString = fs.readFileSync(donoFilePath, 'utf8')
      const donoJsonObj = JSON.parse(donoJsonString);
      this.donationsExports = donoJsonObj.donationsArr
      this.latestExportDate = donoJsonObj.cacheDate
      
    } catch (err){
      console.log('cached donations read error:', err)
    }
    const supporterFilePath = '../cached/supporters/cached_supporters.json'
    try {
      const supporterJsonString = fs.readFileSync(supporterFilePath, 'utf8')
      const supporterJsonObj = JSON.parse(supporterJsonString);
      this.supporters = supporterJsonObj.supportersArr
      
    } catch (err){
      console.log('cached donations read error:', err)
    }
    
  }

  initialize = async() => {
    console.log('initializing...')
    const donoFilePath = '../cached/donations/cached_donations.json'
    const supporterFilePath = '../cached/supporters/cached_supporters.json'
    if(fs.existsSync(donoFilePath) && fs.existsSync(supporterFilePath)){
      const newDonos = await this.checkIfNewDonosSinceCached()
      if(newDonos) {
        console.log('new donations since last cache')
        await this.initializeFromLatest()
      } else {
        console.log('no new doanations since last cache')
        await this.initializeFromCached()
      }

    } else {
      console.log('no cached found')
      await this.initializeFromLatest()
    }

  }

  checkIfNewDonosSinceCached = async() => {
    const cachedDonoCount = await this.getDonationCountAtLastCache()
    const latestDonoCount = await getDonationsLength()
    if (cachedDonoCount < latestDonoCount) {
      return true
    } else {
      return false
    }
  }

  getSupporters = async() => {
    const supporters = await getSupporters();
    return supporters;
  }

  getDonationsExports = async() => {
    this.getReportAttempts += 1;
    console.log(`retrieving donations export from API. attempt No.: ${this.getReportAttempts}`);
    const url = await requestExportData();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(this.reportRetrieveDelay);
    if (this.getReportAttempts < this.maxAttempts) {
      try {
        const report = await retrieveExportDataByUrl(url);
        return report;
      } catch (error) {
        console.log(error, "catch error");
        return this.getDonationsExports();
      }
    } else {
      this.getReportAttempts = 0;
      console.log("maximum number of attempts exceeded");
    }
  }

  cacheLatestDonationsToJson = async() => {
    console.log('caching donations...')
    const date = this.latestExportDate
    const filePath = `../cached/donations/cached_donations.json`
    const donationsCacheObj = {
      cacheDate: date,
      donationsArr: this.donationsExports
    }
    const jsonWriteString = JSON.stringify(donationsCacheObj, null, 2);
    try {
      fs.writeFile(filePath, jsonWriteString, (err) => {
        if(err) {
          console.error('error caching donations to json:', err)
        } else {
          console.log('donations cached successfully')
        } 
      })
    } catch (error) {
      console.log('cache donation error:', error.message)
    }
  }

  cacheLatestSupportersToJson = async() => {
    console.log('caching supporters...')
    const date = this.latestExportDate
    const filePath = `../cached/supporters/cached_supporters.json`
    const supportersCacheObj = {
      cacheDate: date,
      supportersArr: this.supporters
    }
    const jsonWriteString = JSON.stringify(supportersCacheObj, null, 2);
    try {
      fs.writeFile(filePath, jsonWriteString, (err) => {
        if(err) {
          console.error('error caching supporters to json:', err)
        } else {
          console.log('supporters cached successfully')
        } 
      })
    } catch (error) {
      console.log('cache supporters error:', error.message)
    }
  }

  getDonationCountAtLastCache = async () => {
    const filePath = '../cached/donations/cached_donations.json'
    try {
      const jsonString = fs.readFileSync(filePath, 'utf8')
      const jsonObj = JSON.parse(jsonString);
      const cachedDonoCount = jsonObj.donationsArr.length
      return cachedDonoCount
    } catch (err){
      console.log('cached donations read error:', err)
    }
  }

  getAllDonationsBySupporterId = async(supporterId) => {
    if(!this.donationsExports) {
      await this.initialize()
      const allSupporterDonos = this.donationsExports.filter((x) => x.supporter_id === supporterId).map(x => x = x.amount)
      return allSupporterDonos
    } else {
      const allSupporterDonos = this.donationsExports.filter((x) => x.supporter_id === supporterId).map(x => x = x.amount)
      return allSupporterDonos
    }
  }

  getSupporterNameBySupporterId = async(supporterId) => {
    if(!this.supporters) {
      await this.initialize()
      const name = this.supporters.filter((x) => x.id === supporterId)[0].name
      return name
    } else {
      await this.initialize()
      const name = this.supporters.filter((x) => x.id === supporterId)[0].name
      return name.name
    }
  }

  getSupporterIdByName = async(name) => {
    if(!this.supporters) {
      await this.initialize()
      const suppId = this.supporters.filter((x) => x.name === name)[0].id
      return suppId
    } else {
      await this.initialize()
      const suppId = this.supporters.filter((x) => x.name === name)[0].id
      return suppId
    }
  }

  getSumOfDonos = (donoArr) => {
    const initVal = 0
    const sum = donoArr.reduce((acc, curr) => acc + curr, initVal)
    return sum
  }

  getLifetimeValueOfSupporterById = async(id) => {
    const allSuppDonos = await this.getAllDonationsBySupporterId(id)
    const sum = this.getSumOfDonos(allSuppDonos)
    const sumInPounds = sum / 100
    const donoSumStr = `£${sumInPounds}`
    return donoSumStr
  }

  getLifetimeReportOnSupporterByName = async(name) => {
    const suppId = await this.getSupporterIdByName(name)
    const lifetimeSupport = await this.getLifetimeValueOfSupporterById(suppId)
    const reportCard = new ReportCard(name, lifetimeSupport)
    console.log(reportCard)
  }

  getLifetimeReportOnAllSupporters = async() => {
    const donoMap = new Map()
    if(!this.supporters) {
      await this.initialize()
      for (const supporter of this.supporters) {
        const lifetimeSupport = await this.getLifetimeValueOfSupporterById(supporter.id)
        const reportCard = new ReportCard(supporter.name, lifetimeSupport)
        console.log(reportCard)
      }
    } else {
      for (const supporter of this.supporters) {
        const lifetimeSupport = await this.getLifetimeValueOfSupporterById(supporter.id)
        const reportCard = new ReportCard(supporter.name, lifetimeSupport)
        console.log(reportCard)
      }
    }
  }
}


const report = new Report();


report.getLifetimeReportOnSupporterByName('Margarett Toy DVM')


