const fs = require('fs');
const fastify = require('fastify')()
const http = require("http");

const port = +process.argv[2] || 3000

const client = require('redis').createClient()
client.on('error', (err) => console.log('Redis Client Error', err));


const start = async () => {
    try {
        console.log(`Example app listening at http://0.0.0.0:${port}`)
        await fastify.listen(port)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
client.on('ready', start)

const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);
fastify.get('/ready', async (request, reply) => {
    return { ready: true }
})
const parsedUUIDs={}
const usersFinished={}
fastify.get('/card_add', async (request, reply) => {
    if(usersFinished[request.query.id]){
        reply.sent = true
        reply.raw.end('{"id":"ALL CARDS"}')
        return
    }

    // This magic will reduce the uuid into a shorter buffer to reduce network traffic
    let key
    if(!(key = parsedUUIDs[request.query.id])){
        key=parsedUUIDs[request.query.id]=Buffer.from(request.query.id.replace(/\-/g,''),'hex')
    }
    // No idea if it's better but it seems to be on the lucky side of tests
    result = await client.sendCommand(['INCR',key])
    if(result>cards.length) {
        usersFinished[request.query.id]=true
        reply.sent = true
        reply.raw.end('{"id":"ALL CARDS"}')
        return
    }

    const card = cards[result-1]
    reply.sent = true
    // Manulally creating json for maximum efficiency, += string concat is the fastest way to do it
    let res='{"id":"'
    res+=card.id
    res+='","name":"'
    res+=card.name
    res+='"}'
    reply.raw.end(res)
})



client.connect();
