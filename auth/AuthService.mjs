'use strict'

export default class AuthService {
  constructor (credentialCollection, jwtLib) {
    this.credentialCollection = credentialCollection
    this.jwtLib = jwtLib
  }

  async login ({ username, password }) {
    const doc = await this.credentialCollection.findOne({ username, password })

    if (!doc) {
      throw new Error('Wrong credentials')
    }

    const { profile } = doc

    const token = this.jwtLib.sign(profile)

    return {
      token
    }
  }

  isAllowed (log, payload, routeConfig) {
    const { role } = payload
    log.info({ actualRole: role, allowedRoles: routeConfig.rolesAllowed }, 'check the user role')
    return (routeConfig.rolesAllowed || []).includes(role)
  }
}
