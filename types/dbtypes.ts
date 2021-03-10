export interface Exp {
  id: string
  exp: number
}

export interface Greetings {
  guild: string
  channel?: string
  join_title_format?: string | null
  join_desc_format?: string | null
  leave_title_format?: string | null
  leave_desc_format?: string | null
}

export interface ServerData {
  noticeChannel: string
  sendLevelMessage: boolean
}

export interface Warns {
  uuid: string
  guild: string
  member: string
  count: number
  warnby: string
  reason: string
  dt: string
}

export interface LoggingSet {
  channel: string
  flags: string
}

export interface Billboard {
  uuid: string
  guild: string
  channel: string
  value: string
}

export interface MemberCount {
  uuid: string
  guild: string
  dt: string
  count: number
}

export interface MsgCount {
  uuid: string
  guild: string
  dt: string
  count_user: number
  count_bot: number
}

type TicketPermsOpenClose = { opened: { allow: number, deny: number }, closed: { allow: number, deny: number } }

export interface TicketSetPOST {
  guild: string
  name: string
  channel: string
  emoji: string
  category: string | null
  access_roles: string[]
  mention_roles: boolean
}

export interface TicketSet {
  uuid: string
  guild: string
  name: string
  channel: string
  emoji: string
  category_opened: string | null
  category_closed: string | null
  message: string

  access_roles: string[]
  other_roles: string[]

  mention_roles: boolean
  ticket_number: number

  create_message: string
  initial_message: string

  opener_perms: TicketPermsOpenClose
  access_perms: TicketPermsOpenClose
  other_perms: TicketPermsOpenClose
}

export interface Ticket {
  uuid: string
  setuuid: string
  channel: string
  opener: string
  number: number
  status: 'open' | 'closed'
}