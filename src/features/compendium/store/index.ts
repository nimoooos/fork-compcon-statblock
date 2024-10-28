import _ from 'lodash'
import semver from 'semver'
import lancerData from '@massif/lancer-data'
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import {
  License,
  CoreBonus,
  Skill,
  Frame,
  MechWeapon,
  WeaponMod,
  MechSystem,
  Tag,
  PilotWeapon,
  PilotArmor,
  PilotGear,
  Talent,
  Reserve,
  Manufacturer,
  NpcClass,
  NpcTemplate,
  NpcFeature,
  ContentPack,
  CompendiumItem,
  PilotEquipment,
} from '@/class'
import {
  ICoreBonusData,
  ITalentData,
  IFrameData,
  IMechWeaponData,
  ISkillData,
  IPilotArmorData,
  IPilotWeaponData,
  IWeaponModData,
  IMechSystemData,
  IManufacturerData,
  IContentPack,
  ITagCompendiumData,
  IPilotEquipmentData,
} from '@/interface'
import { saveData as saveUserData, loadData as loadUserData } from '@/io/Data'
import { IReserveData } from '@/classes/pilot/components/reserves/Reserve'
import * as PlayerAction from '@/classes/Action'
import { Background, IBackgroundData } from '@/classes/Background'
import Vue from 'vue'
import { Bond } from '@/classes/pilot/components/bond/Bond'
import { CatchErrorAsyncMethod } from '@/util/CatchError'

export const SET_VERSIONS = 'SET_VERSIONS'
export const LOAD_DATA = 'LOAD_DATA'

export const LOAD_PACK = 'LOAD_PACK'
export const DELETE_PACK = 'DELETE_PACK'
export const CLEAR_PACKS = 'CLEAR_PACKS'
export const SET_PACK_ACTIVE = 'SET_PACK_ACTIVE'

export const SET_MISSING_CONTENT = 'SET_MISSING_CONTENT'

function Brewable<T extends CompendiumItem>(base: () => T[]): Function {
  return function (self: CompendiumStore, name: string) {
    const baseName = `__Base_${name}`

    Object.defineProperty(self, baseName, {
      get: base,
    })
    Object.defineProperty(self, name, {
      get: function () {
        return [...this[baseName], ...this.ContentPacks.flatMap(pack => pack[name])]
      },
    })
  }
}

function sortByDependencies(packs: IContentPack[]): IContentPack[] {
  function dfs(node, visited, stack) {
    if (!visited[node.id]) {
      visited[node.id] = true
      for (const dependencyId of node.manifest.dependencies) {
        const dependentNode = packs.find(obj => obj.id === dependencyId)
        if (dependentNode) {
          dfs(dependentNode, visited, stack)
        }
      }
      stack.push(node)
    }
  }

  const sortedStack = []
  const visited = {}

  for (const pack of packs) {
    dfs(pack, visited, sortedStack)
  }

  return sortedStack.reverse()
}

//iterate through the content packs and find the ones missing an installed dependency
function findMissingDependencies(packs: IContentPack[]): IContentPack[] {
  const missing = [] as IContentPack[]
  for (const pack of packs) {
    if (!pack.manifest.dependencies) continue
    for (const dependency of pack.manifest.dependencies) {
      const dependentNode = packs.some(pack => pack.manifest.name === dependency.name)
      if (!dependentNode) {
        missing.push(pack)
      }
    }
  }
  return missing
}

@Module({
  name: 'datastore',
})
export class CompendiumStore extends VuexModule {
  public LancerVersion = ''
  public CCVersion = ''

  public ContentPacks: ContentPack[] = []

  public MissingContent: any = { pilots: [], npcs: [] }

  public get NpcClasses(): NpcClass[] {
    return this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.NpcClasses)
  }
  public get NpcTemplates(): NpcTemplate[] {
    return this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.NpcTemplates)
  }
  public get NpcFeatures(): NpcFeature[] {
    return this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.NpcFeatures)
  }
  public get Bonds(): Bond[] {
    return this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.Bonds)
  }

  @Brewable(() => lancerData.talents.map((x: ITalentData) => new Talent(x)))
  Talents: Talent[]
  @Brewable(() => lancerData.core_bonuses.map((x: ICoreBonusData) => new CoreBonus(x)))
  CoreBonuses: CoreBonus[]
  @Brewable(() => lancerData.frames.map((x: IFrameData) => new Frame(x)))
  Frames: Frame[]
  @Brewable(() =>
    lancerData.manufacturers.map((x: IManufacturerData) => {
      const m = new Manufacturer(x)
      m.setCorsSafe()
      return m
    })
  )
  Manufacturers: Manufacturer[]
  @Brewable(() => lancerData.weapons.map((x: IMechWeaponData) => new MechWeapon(x)))
  MechWeapons: MechWeapon[]
  @Brewable(() => lancerData.mods.map((x: IWeaponModData) => new WeaponMod(x)))
  WeaponMods: WeaponMod[]
  @Brewable(() => lancerData.systems.map((x: IMechSystemData) => new MechSystem(x)))
  MechSystems: MechSystem[]
  @Brewable(() =>
    lancerData.pilot_gear.map(function (x: any) {
      if (x.type.toLowerCase() === 'weapon') return new PilotWeapon(x as IPilotWeaponData)
      else if (x.type.toLowerCase() === 'armor') return new PilotArmor(x as IPilotArmorData)
      return new PilotGear(x as IPilotEquipmentData)
    })
  )
  PilotGear: PilotEquipment[]
  @Brewable(() => lancerData.skills.map((x: ISkillData) => new Skill(x)))
  Skills: Skill[]

  public get Backgrounds(): Background[] {
    return lancerData.backgrounds
      .map((x: IBackgroundData) => new Background(x))
      .concat(this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.Backgrounds))
  }

  public get Actions(): PlayerAction.Action[] {
    return lancerData.actions
      .map((x: PlayerAction.IActionData) => new PlayerAction.Action(x))
      .concat(this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.Actions))
  }

  public get Tags(): Tag[] {
    return lancerData.tags
      .map((x: ITagCompendiumData) => new Tag(x))
      .concat(this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.Tags))
  }

  public get Reserves(): Reserve[] {
    return lancerData.reserves
      .map((x: IReserveData) => new Reserve(x))
      .concat(this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.Reserves))
  }

  public get Statuses(): Status[] {
    return lancerData.statuses.concat(
      this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.Statuses)
    )
  }

  public get Environments(): Environment[] {
    return lancerData.environments.concat(
      this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.Environments)
    )
  }

  public get Sitreps(): Sitrep[] {
    return lancerData.sitreps.concat(
      this.ContentPacks.filter(pack => pack.Active).flatMap(pack => pack.Sitreps)
    )
  }

  public get Tables(): any {
    const tables = lancerData.tables
    this.ContentPacks.filter(pack => pack.Active).forEach(pack => {
      for (const t in pack.Tables) {
        if (tables[t] !== undefined) tables[t] = [...tables[t], ...pack.Tables[t]]
        else tables[t] = pack.Tables[t]
      }
    })
    return tables
  }

  get Licenses(): License[] {
    function variantLicenseMatch(variantFrame: Frame, licenseFrame: Frame): boolean {
      if (!!variantFrame.Variant && !!variantFrame.LicenseID) {
        return variantFrame.LicenseID === licenseFrame.ID
      } else {
        return (
          variantFrame.Variant.toUpperCase() === licenseFrame.Name.toUpperCase() &&
          variantFrame.Source.toUpperCase() === licenseFrame.Source.toUpperCase()
        )
      }
    }
    return this.Frames.filter(x => x.LicenseLevel !== 0 && !x.IsHidden).map(frame => {
      const variants = this.Frames.filter(f => !f.IsHidden && variantLicenseMatch(f, frame))
      return new License(frame, variants)
    })
  }

  // TODO: just set as part of the data loader
  @Mutation
  private [SET_VERSIONS](lancer: string, cc: string): void {
    this.LancerVersion = lancer
    this.CCVersion = cc
  }

  // @Mutation
  // private [LOAD_DATA](): void {
  //   getUser().then(profile => (this.UserProfile = profile))
  // }

  @Mutation
  private [SET_MISSING_CONTENT](payload: any): void {
    this.MissingContent = payload
  }

  @Mutation
  private [CLEAR_PACKS](): void {
    this.ContentPacks.splice(0, this.ContentPacks.length)
  }

  @Mutation
  private [LOAD_PACK](packData: IContentPack): void {
    const pack = new ContentPack(packData)
    this.ContentPacks = [...this.ContentPacks, pack]
  }

  @Mutation
  private [DELETE_PACK](packID: string): void {
    this.ContentPacks = this.ContentPacks.filter(pack => pack.ID !== packID)
  }

  @Mutation
  private [SET_PACK_ACTIVE](payload: { packID: string; active: boolean }): void {
    const { packID, active } = payload
    this.ContentPacks.find(pack => pack.ID === packID).SetActive(active)
    this.ContentPacks = [...this.ContentPacks]
  }

  @Action
  @CatchErrorAsyncMethod()
  public async setPackActive(payload: { packID: string; active: boolean }): Promise<void> {
    this.context.commit(SET_PACK_ACTIVE, payload)
    await saveUserData(
      'extra_content.json',
      this.ContentPacks.map(pack => pack.Serialize())
    )
  }

  @Action
  @CatchErrorAsyncMethod()
  public async installContentPack(pack: IContentPack): Promise<void> {
    if (this.packAlreadyInstalled(pack.id)) {
      console.info(`pack ${pack.manifest.name} [${pack.id}] already exists, deleting original...`)
      await this.deleteContentPack(pack.id)
    }
    this.context.commit(LOAD_PACK, pack)
    await saveUserData(
      'extra_content.json',
      this.ContentPacks.map(pack => pack.Serialize())
    )
    await this.refreshExtraContent()
  }

  @Action
  @CatchErrorAsyncMethod()
  public async deleteContentPack(packID: string): Promise<void> {
    this.context.commit(DELETE_PACK, packID)
    await saveUserData(
      'extra_content.json',
      this.ContentPacks.map(pack => pack.Serialize())
    )
    await this.refreshExtraContent()
  }

  @Action
  @CatchErrorAsyncMethod()
  public async loadExtraContent(): Promise<void> {
    const content = await loadUserData('extra_content.json')
    try {
      content.forEach(c => this.context.commit(LOAD_PACK, c))
    } catch (err) {
      console.error(err)
    }
  }

  @Action
  @CatchErrorAsyncMethod()
  public async refreshExtraContent(): Promise<void> {
    await this.context.commit(CLEAR_PACKS)

    let content = (await loadUserData('extra_content.json')) as IContentPack[]
    content.forEach(pack => {
      if (!pack.manifest.dependencies) pack.manifest.dependencies = []
    })

    content = sortByDependencies(content)

    const packsMissingContent = findMissingDependencies(content)
    packsMissingContent.forEach(pack => {
      pack.missing_content = true
    })

    try {
      content.forEach(c => this.context.commit(LOAD_PACK, c))
    } catch (err) {
      console.error(err)
    }
  }

  get packAlreadyInstalled(): any {
    return (packStr: string, version?: string) => {
      let candidates = this.ContentPacks.filter(
        pack => packStr === pack.Name || packStr === pack.ID
      )

      if (!version || version === '*') return candidates.length > 0
      if (version.startsWith('=')) return candidates.some(pack => pack.Version === version.slice(1))

      return candidates.some(pack => {
        return semver.gte(semver.coerce(pack.Version), semver.coerce(version))
      })
    }
  }

  private nfErr = { err: 'ID not found' }

  get instantiate(): any | { err: string } {
    return (itemType: string, id: string) => {
      if (this[itemType] && this[itemType] instanceof Array) {
        const i = this[itemType].find((x: any) => x.ID === id || x.id === id)
        if (i) return _.cloneDeep(i)
        const miID = `missing_${itemType.toLowerCase()}`
        const missingItem = this[itemType].find((x: any) => x.ID === miID || x.id === miID)
        if (missingItem) return _.cloneDeep(missingItem)
        return this.nfErr
      }
      return { err: 'Invalid Item Type' }
    }
  }

  get referenceByID(): any | { err: string } {
    return (itemType: string, id: string) => {
      if (this[itemType] && this[itemType] instanceof Array) {
        const i = this[itemType].find((x: any) => x.ID === id || x.id === id)
        if (i) return i
        const miID = `missing_${itemType.toLowerCase()}`
        const missingItem = this[itemType].find((x: any) => x.ID === miID || x.id === miID)
        if (missingItem) return missingItem
        return this.nfErr
      }
      return { err: 'Invalid Item Type' }
    }
  }

  get getItemCollection(): any {
    return (itemType: string) => {
      return this[itemType].filter(x => x && !x.IsHidden)
    }
  }

  get lcpNames(): string[] {
    let frame_packs = this.Frames.map(x => x.LcpName)
    let lcp_packs = this.ContentPacks.map(x => x.Name)
    return _.unionWith(frame_packs, lcp_packs, _.isEqual)
  }

  get getVersion(): string {
    return this.CCVersion
  }

  @Action
  @CatchErrorAsyncMethod()
  public async setVersions(lancerVer: string, ccVer: string): Promise<void> {
    this.context.commit(SET_VERSIONS, { lancerVer, ccVer })
  }

  @Action
  public setMissingContent(payload: any): void {
    this.context.commit(SET_MISSING_CONTENT, payload)
  }
}
