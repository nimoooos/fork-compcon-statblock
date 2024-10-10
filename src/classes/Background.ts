import { Skill } from "@/class"

interface IBackgroundData {
  id: string
  name: string
  description: string
  skills?: Skill[]
}

class Background {
  public readonly ID: string
  public readonly Name: string
  public readonly Description: string
  public readonly LcpName: string
  public readonly InLcp: boolean
  public readonly Skills: Skill[]

  public constructor(data: IBackgroundData, packName?: string) {
    this.ID = data.id
    this.Name = data.name
    this.Description = data.description
    this.LcpName = packName || 'LANCER Core Book'
    this.InLcp = packName ? true : false
    this.Skills = data.skills
  }

}

export { Background, IBackgroundData }
