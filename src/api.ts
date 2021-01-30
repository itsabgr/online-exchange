import * as mongo from 'mongodb'
import crypto from 'crypto'

type longtitude = number
type latitude = number
interface exchange
{
    _id: mongo.ObjectId
    n: string //unique name
    a: number //amount
    u: string //unit
    k?: string | null //pwd
    v: number //revision
    t: Array<{ a: number; u: string }> //targets
    c: string //conn
    l: Array<string> //langs
    p: number //last trigger
    e: number //expire at,
    s: Array<mongo.ObjectId> //suggested
    g?: { type: 'Point'; coordinates: [longtitude, latitude] } //geo
}
function hash ( pwd: string ): string
{
    return crypto.createHash( 'sha256' ).update( pwd ).digest().toString( 'base64' )
}
export default class Api
{
    private db: mongo.Db
    constructor ( db: mongo.Db )
    {
        this.db = db
    }
    async getExchange (
        name: string,
        rev: number,
        pwd?: string | null
    ): Promise<exchangePresentation>
    {
        let now = Math.floor( Date.now() / 1000 )
        let { value } = await this.db
            .collection<exchange>( 'exchanges' )
            .findOneAndUpdate(
                {
                    p: { $lt: now - 10 },
                    v: { $gt: rev },
                    name,
                    pwd: pwd ? hash( pwd ) : null,
                },
                { $set: { p: now, s: [] } },
                {
                    returnOriginal: true,
                    projection: {
                        t: 1,
                        _id: 1,
                        s: 1,
                        e: 1,
                        a: 1,
                        u: 1,
                        c: 1,
                        l: 1,
                        g: 1,
                        v: 1,
                        n: 1,
                    },
                }
            )
        if ( !value ) {
            throw new Error( 'auth' )
        }
        return {
            amount: value.a,
            unit: value.u,
            name: value.n,
            revision: value.v,
            targets: value.t.map( ( { u, a } ) =>
            {
                return { unit: u, amount: a }
            } ),
            conn: value.c,
            langs: value.l,
            suggestions: ( await Promise.all( value.s
                .map( ( _id ) =>
                {
                    return this.db
                        .collection<exchange>( 'exchanges' )
                        .findOne(
                            { _id },
                            { projection: { a: 1, _id: 0, u: 1, l: 1, c: 1 } }
                        )

                } ) ) )
                .filter( ( found ): found is exchange => !!found )
                .map( ( { u, a, c, l } ) =>
                {
                    return { amount: a, unit: u, conn: c, langs: l }
                } ),
            location: {
                lng: value.g?.coordinates[0] ?? 0,
                lat: value.g?.coordinates[1] ?? 0,
            },
        }
    }

    async newExchange ( {
        name,
        pwd,
        amount,
        unit,
        targets,
        langs,
        conn,
        location,
        revision,
    }: exchangePresentation ): Promise<{
        id: string
        expireAt: number
        rev: number
    }>
    {
        let now = Math.floor( Date.now() / 1000 )
        let expireAt = now + 60 * 24 * 3
        let doc: exchange = {
            _id: new mongo.ObjectId(),
            n: name,
            k: pwd ? hash( pwd ) : null,
            a: amount,
            u: unit,
            t: targets.map( ( { unit, amount } ) =>
            {
                return { u: unit, a: amount }
            } ),
            c: conn,
            l: langs,
            g: location ? { type: 'Point', coordinates: [location.lng, location.lat] } : undefined,
            e: expireAt,
            p: now,
            v: revision,
            s: [],
        }
        let id: mongo.ObjectId;
        ( { insertedId: id } = await this.db
            .collection<exchange>( 'exchanges' )
            .insertOne( doc ) )
        return { id: id.toHexString(), expireAt, rev: 0 }
    }
}
export interface exchangePresentation
{
    name: string
    amount: number
    unit: string
    targets: Array<{ amount: number; unit: string }>
    conn: string
    suggestions: Array<{
        amount: number
        unit: string
        conn: string
        langs: Array<string>
    }>
    langs: Array<string>
    revision: number
    location?: { lng: number; lat: number }
    pwd?: string
}
