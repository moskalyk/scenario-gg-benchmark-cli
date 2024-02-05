# scenario-generator-cli-benchmark
an example code script that cycles through schedulers to produce timed results

## example usage

```
pnpm run scenario:benchmark generate "<prompt>"
┌──────────────────────────────┬──────────────────────────────┐
│ Scheduler                    │ Time (ms)                    │
├──────────────────────────────┼──────────────────────────────┤
│ DDIMScheduler                │ 11.514                       │
├──────────────────────────────┼──────────────────────────────┤
│ DDPMScheduler                │ 13.386                       │
...
└──────────────────────────────┴──────────────────────────────┘
```