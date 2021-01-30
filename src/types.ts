import { ObjectID, ObjectId } from 'mongodb'


export interface exchangeTarget
{
    u: string//unit
    a?: number//amount
}
export enum NotifKind
{
    None = 0,
    suggestExchange = 1
}
export interface NotifKindSuggestExchange
{
    i: ObjectID//exchange id
}

export interface Notification
{
    _id: ObjectID
    e: Date//expire at
    k: NotifKind//kind
    t: string//target public key
    p: any | NotifKindSuggestExchange //payload
}
export interface exchangeRequest
{
    _id: ObjectID
    M: number//max notif
    A: number//amount
    U: string//unit
    T: Array<exchangeTarget>
    C: number//connection url
    P: number //reversed priority
    N: string//name
    E?: Date //expire at
    L?: Array<string>,//language codes
    G?: {//geo location
        type?: 'Point'
        coordinates?: [number, number]
    }
}
