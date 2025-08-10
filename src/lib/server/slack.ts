import Slack from '@slack/web-api'
import { SLACK_BOT_TOKEN } from '$env/static/private'

const client = new Slack.WebClient(SLACK_BOT_TOKEN)

export default client;
