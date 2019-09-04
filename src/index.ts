import { SSM } from 'aws-sdk'

export default class SsmEnvInjector {
  private client: SSM

  constructor() {
    this.client = new SSM({ apiVersion: 'latest' })
  }

  public async inject(path: string): Promise<void> {
    const params: SSM.ParameterList = await this.loadParams(path)
    this.injectParams(params, path)
  }

  private async loadParams(path: string, token: string = null): Promise<SSM.ParameterList> {
    const result = await this.client
      .getParametersByPath({
        MaxResults: 10,
        NextToken: token,
        Path: path,
        Recursive: true,
        WithDecryption: true
      })
      .promise()

    if (result.NextToken) {
      const nextPage = await this.loadParams(path, result.NextToken)
      return result.Parameters.concat(nextPage)
    } else {
      return result.Parameters
    }
  }

  private injectParams(params: SSM.ParameterList, path: string): void {
    params.forEach(({ Name, Value }: SSM.Parameter) => {
      const pureName = Name.replace(path, '')
      process.env[pureName] = Value
    })
  }
}
