import lodash from 'lodash';
import { Filter, ObjectId } from 'mongodb';
import db from '../service/db';

export enum CardDocType {
    CARD_TYPE_CARD,
    CARD_TYPE_USERDOC,
}

export class CardDoc {
    _id: ObjectId;
    type = CardDocType.CARD_TYPE_CARD;
    description: string;
    picture: string;
    level: number;
    weight: number;
}

export class UserCardDoc {
    type = CardDocType.CARD_TYPE_USERDOC;
    user: number;
    cards: [ObjectId, Date][];
    luck: number;
    day: number;
}

export class CardModel {
    static coll = db.collection('card');

    static add(description: string, picture: string, level: number, weight: number) {
        return CardModel.coll.insertOne({
            type: CardDocType.CARD_TYPE_CARD,
            _id: new ObjectId(),
            description,
            picture,
            level,
            weight,
        });
    }

    static del(_id: ObjectId) {
        return CardModel.coll.deleteOne({ _id });
    }

    static get(_id: ObjectId) {
        return CardModel.coll.findOne({ _id });
    }

    static async getLast(user: number) {
        const userCardDoc = await this.getUser(user);
        if (!userCardDoc || userCardDoc.cards.length === 0) return undefined;
        return userCardDoc.cards[userCardDoc.cards.length - 1];
    }

    static async getUser(user: number) {
        const userCardDoc = await CardModel.coll.findOne({ type: CardDocType.CARD_TYPE_USERDOC, user });
        return userCardDoc as UserCardDoc;
    }

    static getMany(query: Filter<CardDoc>) {
        return CardModel.coll.find(query);
    }

    static async random(user: number): Promise<ObjectId> {
        const lastCard = await this.getLast(user);
        if (lastCard) {
            const date = new Date(lastCard[1]);
            if (`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
                === `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`) {
                return lastCard[0];
            }
        }
        let udoc = await this.getUser(user);
        udoc ||= {
            type: CardDocType.CARD_TYPE_USERDOC,
            user,
            cards: [],
            luck: 1,
            day: 0,
        };
        let allowedCards = [];
        const existsCards = [];
        for (const card of udoc.cards) existsCards.push(card[0]);
        if (udoc.day === 10) {
            allowedCards = await CardModel.coll.find({
                type: CardDocType.CARD_TYPE_CARD,
                _id: { $nin: existsCards },
            }).toArray();
        } else {
            allowedCards = await CardModel.coll.find({
                type: CardDocType.CARD_TYPE_CARD,
            }).toArray();
        }
        let weightSum = 0;
        let now = 0;
        allowedCards.forEach((card) => {
            weightSum += card.weight;
        });
        allowedCards = lodash.shuffle(allowedCards);
        let randNumber = Math.floor(Math.random() * weightSum);
        while (randNumber >= allowedCards[now].weight) {
            randNumber -= allowedCards[now].weight;
            now++;
        }
        if (udoc.cards.find((card) => card[0] === allowedCards[now]._id)) {
            udoc.day++;
            udoc.luck++;
        } else {
            udoc.day = 0;
            udoc.luck = 1;
        }
        udoc.cards.push([allowedCards[now]._id, new Date()]);
        await CardModel.coll.updateOne({ type: CardDocType.CARD_TYPE_USERDOC, user }, { $set: udoc }, { upsert: true });
        return allowedCards[now]._id;
    }

    static async getTimes(user: number, cid: ObjectId) {
        const udoc = await this.getUser(user);
        if (!udoc) return 0;
        return udoc.cards.filter((card) => card[0].toString() === cid.toString()).length;
    }
}
