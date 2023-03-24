import { Component } from "./entity.js"

export class UIController extends Component {

  _params:any;
  _quests:any;
  iconBar_:any;
  _ui:any;
  chatElement_:any

  //TODO: inteface
  constructor(params:any = null) {
    super()
    if (params != null) {
      this._params = params
      this._quests = {}
    }
  }

  InitComponent() {
    this.iconBar_ = {
      stats: document.getElementById('icon-bar-stats'),
      inventory: document.getElementById('icon-bar-inventory'),
      quests: document.getElementById('icon-bar-quests')
    }

    this._ui = {
      inventory: document.getElementById('inventory'),
      stats: document.getElementById('stats'),
      quests: document.getElementById('quest-journal')
    }

    const e:HTMLElement|null = document.getElementById('quest-ui')
    e!.style.visibility = 'hidden'

    this.iconBar_.inventory.onclick = (m:any) => {
      this.OnInventoryClicked_(m)
    }
    this.iconBar_.stats.onclick = (m:any) => {
      this.OnStatsClicked_(m)
    }
    this.iconBar_.quests.onclick = (m:any) => {
      this.OnQuestsClicked_(m)
    }
    this.HideUI_()

    this.chatElement_ = document.getElementById('chat-input')
    this.chatElement_.addEventListener('keydown', (e:any) => this.OnChatKeyDown_(e), false)
  }

  FadeoutLogin() {
    const loginElement = document.getElementById('login-ui')
    if (loginElement!.classList.contains('fadeOut')) {
      return
    }

    loginElement!.classList.toggle('fadeOut')
    document.getElementById('game-ui')!.style.visibility = 'visible'
  }

  OnChatKeyDown_(evt:any) {
    if (evt.keyCode === 13) {
      evt.preventDefault()
      const msg = this.chatElement_.value
      if (msg != '') {
        const net = this.FindEntity('network').GetComponent('NetworkController')
        net.SendChat(msg)
      }
      this.chatElement_.value = ''
    }
    evt.stopPropagation()
  }

  AddQuest(quest:any) {
    if (quest.id in this._quests) {
      return
    }

    const e = document.createElement('DIV')
    e.className = 'quest-entry'
    e.id = 'quest-entry-' + quest.id
    e.innerText = quest.title
    e.onclick = (evt) => {
      this.OnQuestSelected_(e.id)
    }
    document.getElementById('quest-journal')!.appendChild(e)

    this._quests[quest.id] = quest
    this.OnQuestSelected_(quest.id)
  }

  AddEventMessages(events:any) {
    for (let e of events) {
      if (e.type != 'attack') {
        continue
      }
      if (e.attacker.Name != 'player' && e.target.Name != 'player') {
        continue
      }

      const attackerName = e.attacker.Name == 'player' ? 'You' : e.attacker.Account.name
      const targetName = e.target.Name == 'player' ? 'you' : e.target.Account.name

      this.AddChatMessage({
        name: '',
        text: attackerName + ' hit ' + targetName + ' for ' + e.amount + ' damage!',
        action: true
      })
    }
  }

  AddChatMessage(msg:any) {
    const e = document.createElement('div')
    e.className = 'chat-text'
    if (msg.server) {
      e.className += ' chat-text-server'
    } else if (msg.action) {
      e.className += ' chat-text-action'
    } else {
      e.innerText = '[' + msg.name + ']: '
    }
    e.innerText += msg.text
    const chatElement = document.getElementById('chat-ui-text-area')
    chatElement!.insertBefore(e, document.getElementById('chat-input'))
  }

  OnQuestSelected_(id:any) {
    const quest = this._quests[id]

    const e = document.getElementById('quest-ui')
    e!.style.visibility = ''

    const text = document.getElementById('quest-text')
    text!.innerText = quest.text

    const title = document.getElementById('quest-text-title')
    title!.innerText = quest.title
  }

  HideUI_() {
    this._ui.inventory.style.visibility = 'hidden'
    this._ui.stats.style.visibility = 'hidden'
    this._ui.quests.style.visibility = 'hidden'
  }

  OnQuestsClicked_(msg:any) {
    const visibility = this._ui.quests.style.visibility
    this.HideUI_()
    this._ui.quests.style.visibility = visibility ? '' : 'hidden'
  }

  OnStatsClicked_(msg:any) {
    const visibility = this._ui.stats.style.visibility
    this.HideUI_()
    this._ui.stats.style.visibility = visibility ? '' : 'hidden'
  }

  OnInventoryClicked_(msg:any) {
    const visibility = this._ui.inventory.style.visibility
    this.HideUI_()
    this._ui.inventory.style.visibility = visibility ? '' : 'hidden'
  }

  Update(timeInSeconds:number) {}
}


