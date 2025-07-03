//Not used in my system anymore as it did not work as expected. Replaced by Sentence Transformers approach.
const natural = require("natural");
const wordnet = new natural.WordNet(); // From - Princeton University "About WordNet." WordNet. Princeton University. 2010.

//Get synonyms from the Wordnet lexical database - https://wordnet.princeton.edu/
function getSynonyms(word) {
  return new Promise((resolve) => {
    wordnet.lookup(word, (results) => {
      //Look up words in the wordnet database
      const synonyms = new Set();
      results.forEach((result) => {
        result.synonyms.forEach(
          (syn) => synonyms.add(syn.replace(/_/g, " ").toLowerCase()) //Wordnet stores multi word words using "_" so replace it with space
          //Just to the show the words neatly to the user
        );
      });
      resolve(Array.from(synonyms));
    });
  });
}
//Add/Include the list of synonyms of words in the search query
async function expandSearchQueryWithSynonyms(query) {
  console.log(query);
  const words = query.toLowerCase().split(/\s+/); //Split sentence to array of words - split sentence byspace
  const allWords = new Set(words);

  for (const word of words) {
    const synonyms = await getSynonyms(word);
    console.log(synonyms);
    synonyms.forEach((syn) => allWords.add(syn));
  }

  return Array.from(allWords);
}

module.exports = { expandSearchQueryWithSynonyms };
