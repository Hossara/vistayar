import { bot } from "@app"


bot.start((ctx) => ctx.reply(`
سلام!
به بات ویستا خوش آمدید
`))

bot.command('where_am_i', (ctx) => ctx.reply('Hello'))
bot.command('need_to_talk', (ctx) => ctx.reply('Hello'))
bot.command('edit_point', (ctx) => ctx.reply('Hello'))

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))