Before finding out about they all-cards hack, I was trying to implement an idea that I had, the hack was a faster implementation so I went with it.

The original idea is as such:
1. go with the in-memory way (now with custom tcp like you showed in the meetup)
2. when the service A is out of cards, it will issue a request to other services, asking for a card
3. a service B that has not finished their cards will lock their last card and will give it to back to service A


this is an overview, there are some race conditions like a request before locking but they are easily solved.
this is better because instead of O(N) network calls per user, it will be O(1), and the more cards the faster overall
