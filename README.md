helps upload and search for data with the RateAnybody appname tag on arweave.
for local dev you'll need to generate a wallet, then put it into base64. this is availbale by just using create wallet and convert to base 64 scripts in the scripts directory.
then make a .env file and set WALLET_JSON_BASE64 =  the base 64 walalet. 

to build run: npm run build ; and to deploy run: wrangler pages deploy public --project-name arweavestuff ; replace arweavestuff with whatever name you want

this already works and currently lists 4 sample ratings I made in the rateanybody.com/view page ; and I put up a system wallet with like 19 dollars to use on the rateanybody.com/upload page.

Search barely works because we can only really do exact match searches, and for the uploads I've done so far I've been separating different things in the same value (e.g for assocation I put AMD, Harvard for somebody).
What would make things much easier is having the same tag set to multiple different values. e.g we have assocation : harvard and assocation : AMD ; This is pretty easy to do. It just requires changing the upload logic to handle it.
But for now I don't feel like putting more effort into this and am working on something else. I
