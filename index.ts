import 'dotenv/config'
import api from 'api'

//@ts-ignore
const modelId = process.env.model_id
const sdk = api('@scenario-api/v1.0#fydhn73iklq3ujnso')
//@ts-ignore
sdk.auth(`Basic ${process.env.scenario_api_key}`)

import { Command } from 'commander'
import chalk from 'chalk'
import Table from 'cli-table';

const schedulers = [
    "DDIMScheduler",
    "DDPMScheduler",
    "DEISMultistepScheduler",
    "DPMSolverMultistepScheduler",
    "DPMSolverSinglestepScheduler",
    "EulerAncestralDiscreteScheduler",
    "EulerDiscreteScheduler",
    "HeunDiscreteScheduler",
    "KDPM2AncestralDiscreteScheduler",
    "KDPM2DiscreteScheduler",
    "LCMScheduler",
    "LMSDiscreteScheduler",
    "PNDMScheduler",
    "UniPCMultistepScheduler"
]

const isValidKey = (data: any) => {
    try {
        // Check if 'data' is an object and has 'inference' property
        if (typeof data === 'object' && data !== null && 'inference' in data) {
            // Check if 'inference' has 'images' property which is an array
            if (Array.isArray(data.inference.images) && data.inference.images.length > 0) {
                // Check if the first element of 'images' array has 'url' property
                return 'url' in data.inference.images[0]
            }
        }
    } catch (error) {
        console.error("An error occurred:", error)
    }
    return false;
  }

const getInferenceWithItem = async (prompt: any, scheduler: any) => {
    return new Promise( async (res) => {
      const { data } = await sdk.postModelsInferencesByModelId({
        parameters: {
          type: 'txt2img',
          qualityBoostScale: 4,
          scheduler: 'EulerDiscreteScheduler',
          numSamples: 1,
          prompt: prompt
        }
      }, {modelId: modelId})
      res(data.inference.id)
    })
}

const getInferenceStatus = (id: any, seconds: any) => {
    return new Promise(async (res) => {
        const { data } = await sdk.getModelsInferencesByModelIdAndInferenceId({
            modelId, 
            inferenceId: id
        })
        if(isValidKey(data)){
            res({ status: data.inference.status, seconds: seconds, url: data.inference.images[0].url})
        } else {
            res({ status: data.inference.status, seconds: seconds, url: null })
        }
    })
}

const wait = (ms: any) => new Promise((res) => setTimeout(res, ms));
const program = new Command()
const colors: any = ['magenta', 'greenBright', 'blueBright', 'redBright', 'yellow']  

program
  .name('scenario-scheduler-benchmark')
  .description(
    chalk.rgb(160, 32, 240)(
        `CLI to generate images using scenario from an example prompt \n`+
        `to produce a benchmark matrix across ${schedulers.length} schedulers.\n` +
        '\n' +
        ' ____                              \n' +
        '|  __|___  ___ ___ ___  ___ * ___ \n' +
        '|__  |  _| -_|   |  ^  | -_| | . |\n' +
        '|____|___|___|_|_|_/ \\_|  \\|_|___|\n'
    )
  )
  .version('0.0.1');


program
  .command('generate')
  .description('generate images from a prompt')
  .argument('<prompt>', 'prompt to generate')
  .action(async (prompt: any) => {

    var schedulerTable = new Table({
        head: ['Scheduler', 'Time (ms)']
        , colWidths: [30, 30]
    });

    let start, end: any;
    let times = []
    let counter = 0
    let tableTemp = []
    for(let i = 0; i < schedulers.length; i++){
        start = Date.now()
        const id = await getInferenceWithItem(prompt, schedulers[i])
        while(true){
            await wait(2000)
            const { status, url, address, seconds, prompt }: any = await getInferenceStatus(id, Date.now())
            if (status == 'succeeded') {
                end = Date.now()

                //@ts-ignore
                console.log(chalk[colors[counter++%colors.length]](`scheduler ${i}:${schedulers[i]} complete in ${(end-start)/1000}s`))
                
                times.push((end-start) / 1000)
                tableTemp.push([schedulers[i],`${(end-start)/1000}`])
                break;              
            } else {
                //@ts-ignore
                console.log(chalk[colors[counter++%colors.length]](`${schedulers[i]} : ${status}`))
            }
        }
    }
    tableTemp.sort((a: any, b: any) => a[1] - b[1]);
    schedulerTable.push(...tableTemp)
    console.log(schedulerTable.toString())
  });

program.parse()