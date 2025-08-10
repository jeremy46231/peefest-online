import { DurableObject } from 'cloudflare:workers'

export class GridStorage extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    // Required, as we're extending the base class.
    super(ctx, env)
  }

  async sayHello(): Promise<string> {
    let result = this.ctx.storage.sql
      .exec("SELECT 'Hello, World!' as greeting")
      .one()
    if (typeof result.greeting !== "string") {
      throw new Error("Greeting is not a string")
    }
    return result.greeting
  }
}
