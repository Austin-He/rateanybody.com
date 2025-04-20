site is at [RateAnybody](https://rateanybody.com)

this site helps upload and search for data with the RateAnybody appname tag on arweave.
for local dev you'll need to generate a wallet, then put it into base64. this is availbale by just using create wallet and convert to base 64 scripts in the scripts directory.
then make a .env file and set WALLET_JSON_BASE64 =  the base 64 walalet. 

to build run: npm run build ; and to deploy run: wrangler pages deploy public --project-name arweavestuff ; replace arweavestuff with whatever name you want

this already works and currently lists 4 sample ratings I made in the rateanybody.com/view page ; and I put up a system wallet with like 19 dollars to use on the rateanybody.com/upload page.

I (actually windsurf did 95% lol) made this in like one night because this guy snitched on me for reporting my landlord 3 days prior, and there aren't sites where I can tell people this guy is a snitch. If you see this, fuck you michael lol.

Anyways, now that the site is functional, I can't really be bothered to make it nice for now, but I might if somebody fucks me over again lol.

Notes for feature stuff:

Currently, search barely works. it's not a concern because theres only like 4 entries right now. So
if somebody stumbles upon this somehow and some more entries are actually added I'll fix it.

with arweave's graphql thing we can only really do exact match searches, and for the uploads I've done so far I've been separating different things in the same value (e.g for assocation I put AMD, Harvard for somebody).

What would make things much easier is having the same tag set to multiple different values. e.g we have assocation : harvard and assocation : AMD ; This is pretty easy to do. It just requires changing the upload logic to handle it. And it is actually better to do this sooner instead of later because it'll affect how the
searchabillity of prior data. Still can't be bothered and I'll just bundle and reupload all ratings that use the current convention if this ever gets enough ratings on it that search is needed.

also there's some permaweb thing to deploy sites on arweave natively, so the site stays up as long as arweave does. This should also be pretty easy since the site is fully static.
If anybody tries to sue I'll do this so I have good deniabillity for why I can't take the site down lmao.