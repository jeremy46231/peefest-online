import Slack from '@slack/web-api'
import { env } from '$env/dynamic/private'

const client = new Slack.WebClient(env.SLACK_BOT_TOKEN)

export default client
