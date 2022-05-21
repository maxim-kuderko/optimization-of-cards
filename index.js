const fs = require('fs');
const turbo = require('turbo-http');

const port = +process.argv[2] || 3000

const client = require('redis').createClient()

client.on('error', (err) => console.log('Redis Client Error', err));

let totalNodes = new Promise(async (resolve) => {
    const subscriber = client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe('total-nodes', async (message) => {
        resolve(message)
        await subscriber.disconnect()
    });
})
let nodeId


const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData).map(card=>Buffer.from('{"id":"' + card.id + '","name":"' + card.name + '"}'));

const users={}
const usersFinished={}
let nodes=2
let declared=false

const allCards = Buffer.from('{"id": "ALL CARDS"}');
const ready = Buffer.from('{"ready": true}');
const requestListener = async (req, res) => {
    if (req.url.startsWith('/r')) {
        await new Promise(r => setTimeout(r, 420));//grace period to make sure all services are known
        client.publish('total-nodes',await client.get('total-nodes'))

        res.setHeader('Content-Length', ready.length)
        res.write(ready);
    } else {
        if(!declared){
            nodes=await totalNodes
            declared=true
        }
        const key = req.url.substring(13)
        if(usersFinished[key] || nodeId>nodes){
            res.setHeader('Content-Length', allCards.length)
            res.write(allCards)
            return
        }


        const top = Math.floor(nodeId * (cards.length/nodes)) // not included


        if(!users[key]){
            users[key] =  Math.floor((nodeId-1)*(cards.length/nodes))
        }

        let result = ++users[key]

        if(result>top) {
            usersFinished[key]=true
            res.setHeader('Content-Length', allCards.length)
            res.write(allCards)
            return
        }

        const card = cards[result-1]
        res.setHeader('Content-Length', card.length)
        res.write(card);
    }
};
const server = turbo.createServer(requestListener);

const start = async () => {
    try {
        console.log("Listening on "+ port)
        nodeId= await client.INCR('total-nodes')
        server.listen(port);

        // await fastify.listen(port)
    } catch (err) {
        //fastify.log.error(err)
        process.exit(1)
    }
}
client.on('ready', start)

client.connect();
