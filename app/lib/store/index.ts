import { action, configure, IObservableArray, observable, makeObservable } from 'mobx'
import { useStaticRendering } from 'mobx-react'
// @ts-expect-error no exported member io socket.io-client
import { io } from 'socket.io-client'

import { addTeamApiMethod, getTeamInvitationsApiMethod } from '../api/team-leader'
import { getTeamMembersApiMethod } from '../api/team-member'

import { User } from './user'
import { Team } from './team'

const dev = process.env.NODE_ENV !== 'production'

useStaticRendering(typeof window === 'undefined')

configure({ enforceActions: 'observed' })

class Store {
  public isServer: boolean

  public currentUser?: User = null
  public currentUrl = ''

  public currentTeam?: Team = null

  public teams: IObservableArray<Team> = observable([])

  public socket: SocketIOClient.Socket

  constructor({
    initialState = {},
    isServer,
    socket = null,
  }: {
    initialState?: any
    isServer: boolean
    socket?: SocketIOClient.Socket
  }) {
    makeObservable(this, {
      currentUser: observable,
      currentUrl: observable,
      currentTeam: observable,

      changeCurrentUrl: action,
      setCurrentUser: action,
      setCurrentTeam: action,
    })

    this.isServer = !!isServer

    this.setCurrentUser(initialState.user)

    this.currentUrl = initialState.currentUrl || ''

    // console.log(initialState.user);

    // if (initialState.teamSlug || (initialState.user && initialState.user.defaultTeamSlug)) {
    //   this.setCurrentTeam(
    //     initialState.teamSlug || initialState.user.defaultTeamSlug,
    //     initialState.teams,
    //   );
    // }

    // console.log(initialState.team);

    this.setCurrentTeam(initialState.team)

    this.socket = socket

    if (socket) {
      socket.on('disconnect', () => {
        console.log('socket: ## disconnected')
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log('socket: $$ reconnected', attemptNumber)
      })
    }
  }

  public changeCurrentUrl(url: string) {
    this.currentUrl = url
  }

  public async setCurrentUser(user) {
    if (user) {
      this.currentUser = new User({ store: this, ...user })
    } else {
      this.currentUser = null
    }
  }

  public async addTeam({ name, avatarUrl }: { name: string; avatarUrl: string }): Promise<Team> {
    const data = await addTeamApiMethod({ name, avatarUrl })
    const team = new Team({ store: this, ...data })

    return team
  }

  public async setCurrentTeam(team) {
    if (this.currentTeam) {
      if (this.currentTeam.slug === team.slug) {
        return
      }
    }

    if (team) {
      this.currentTeam = new Team({ ...team, store: this })

      const users =
        team.initialMembers || (await getTeamMembersApiMethod(this.currentTeam._id)).users

      const invitations =
        team.initialInvitations ||
        (await getTeamInvitationsApiMethod(this.currentTeam._id)).invitations

      this.currentTeam.setInitialMembersAndInvitations(users, invitations)
    } else {
      this.currentTeam = null
    }
  }

  public addTeamToLocalCache(data): Team {
    const teamObj = new Team({ user: this.currentUser, store: this, ...data })
    this.teams.unshift(teamObj)

    return teamObj
  }

  public editTeamFromLocalCache(data) {
    const team = this.teams.find((item) => item._id === data._id)

    if (team) {
      if (data.memberIds && data.memberIds.includes(this.currentUser._id)) {
        team.changeLocalCache(data)
      } else {
        this.removeTeamFromLocalCache(data._id)
      }
    } else if (data.memberIds && data.memberIds.includes(this.currentUser._id)) {
      this.addTeamToLocalCache(data)
    }
  }

  public removeTeamFromLocalCache(teamId: string) {
    const team = this.teams.find((t) => t._id === teamId)

    this.teams.remove(team)
  }
}

let store: Store = null

function initializeStore(initialState = {}) {
  const isServer = typeof window === 'undefined'

  const socket = isServer
    ? null
    : io(dev ? process.env.URL_API : process.env.PRODUCTION_URL_API, {
        reconnection: true,
        autoConnect: true,
        transports: ['polling', 'websocket'],
        withCredentials: true,
      })

  const _store =
    store !== null && store !== undefined ? store : new Store({ initialState, isServer, socket })

  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') {
    return _store
  }
  // Create the store once in the client
  if (!store) {
    store = _store
  }

  // console.log(_store);

  return _store
}

function getStore() {
  return store
}

export { Store, initializeStore, getStore }
