# Things for Sujal to check

Nothing on the site was invented. Anything uncertain is listed here and, while
`showReviewMarks` is `true` in `content/site.json`, marked on the page with a dashed note.

## Poems to read once for typos
These were typed by reading your photos and screenshots, so a letter or matra may have been misread.
- **Typed from photos or video:** स्वच्छ भारत, मेरी किताब, मेरा लक्ष्य मार्ग, माँ (Bharat Maa),
  तेरा-मेरा प्रेम, राष्ट्र पहले सिंहासन बाद में, and all English poems from screenshots.
- **Line breaks rebuilt** (the screenshots wrapped long lines): Alone in a Crowd, The Skull, a Cracked Egg.
- **Titles taken from first lines** (no title was given): ख़ामोशी के दरिया में, कल मैं दौड़ता था,
  अलंकारों की दुनिया में, मैं अधूरा सा गीत, आँखों में कोई गहराई, बोलो जय शैलपुत्री माँ,
  The Skull, a Cracked Egg, A Mirror Held Up.
- **Small fixes made:** "Dark Independance Day" shown as "Independence"; "thefights" shown as
  "the fights"; two leftover note lines removed from the end of Forgotten Dreams; the repeated
  slide line "Truth must resonate from within." shown once in A Mirror Held Up.
- **Kept exactly as written:** "मलजय-शीतलां" (माँ), "दाहिनी बुझा / बाई बुझा" (शैलपुत्री),
  the unclosed quote at the end of कल मैं दौड़ता था.
- **ये कांच की दुनिया है:** the site uses your typed copy; the printed book says "कहीं कमल" and "फूल".
- Themes and feelings used for filters were assigned by me. Edit them freely.

## Dates and facts
- **Kavya Dharpan:** book listed as 2022, but the Kavya Darpan Samman as 2021.
- **Blossoming the Day** vs the certificate's "Blossoming Everyday": which title is right?

## Reels and songs
- 16 reels are embedded. Facebook "share" links sometimes refuse to play inside other websites.
  If one shows an error, open it on Facebook, copy the full link (facebook.com/reel/...), and replace it in `content/media.json`.
- Voiceover credit links to https://www.youtube.com/@jaslerlay. Check that this is the right channel.
- The song from "The Curse" is named **The Curse of Love** (from its chorus). Its lyrics are split into verses by me.
- Tere Paas Mai: lyrics added, with an English translation I wrote (labelled "English translation").

## Books
- **From Love's Diary:** all 15 poems are shown, in the book reader and as their own pages.
- **Before They Become Memories:** only the title is shown. Send a short description or contents if you want more.

## Before going live
Set your domain in `content/site.json` (`url`), add your Web3Forms key (`web3formsKey`) for the contact form,
then set `showReviewMarks` to `false` and run `node build.js`.
