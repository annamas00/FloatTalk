from flashtext import KeywordProcessor


keyword_processor = KeywordProcessor()

with open("sensitive_words.txt", "r", encoding="utf-8") as f:
    for line in f:
        word = line.strip()
        if word:
            keyword_processor.add_keyword(word)


def contains_sensitive_word(text: str) -> list[str]:
    return keyword_processor.extract_keywords(text)
