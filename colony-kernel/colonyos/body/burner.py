import os
import time
import signal
import sys
import logging
import psycopg2
from datetime import datetime, timezone
# from colonies import Colonies # Assuming this acts as the "Client" to the local ColonyOS kernel if needed, or we can just run standalone for now.

# --- CONFIGURATION ---
COLONIES_HOST = os.getenv("COLONIES_HOST", "localhost")
COLONIES_PORT = int(os.getenv("COLONIES_PORT", 50050))
COLONIES_TLS = os.getenv("COLONIES_TLS", "false").lower() == "true"
PRVKEY = os.getenv("COLONY_BEE_PRVKEY")  # The Bee's Identity
COLONY_ID = os.getenv("COLONY_ID")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_NAME = os.getenv("POSTGRES_DB", "zyeute")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "password")

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [EXECUTIONER] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BurnerBee:
    def __init__(self):
        self.conn = None
        # self.colonies = Colonies(COLONIES_HOST, COLONIES_PORT, COLONIES_TLS) 
        self.running = True
        
        # Connect to DB
        self.connect_db()
        
        # Register Signal Handlers
        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)

    def connect_db(self):
        try:
            self.conn = psycopg2.connect(
                host=DB_HOST,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
            logger.info("Connected to Zyeuté Database.")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            sys.exit(1)

    def shutdown(self, signum, frame):
        logger.info("Shutting down the Executioner...")
        self.running = False
        if self.conn:
            self.conn.close()

    def scan_and_burn(self):
        """
        Scans for content that meets the 'Burn Protocol' criteria:
        1. is_ephemeral = TRUE
        2. burned_at IS NULL (Not yet burned)
        3. Condition: (expires_at < NOW) OR (view_count >= max_views)
        """
        try:
            cur = self.conn.cursor()
            
            # The Selection Query
            query = """
                SELECT id, user_id, content 
                FROM posts 
                WHERE is_ephemeral = TRUE 
                AND burned_at IS NULL 
                AND (
                    expires_at < NOW() 
                    OR 
                    (max_views > 0 AND view_count >= max_views)
                );
            """
            cur.execute(query)
            targets = cur.fetchall()

            if not targets:
                return

            logger.info(f"Detected {len(targets)} targets for incineration.")

            for target in targets:
                post_id, user_id, content_preview = target
                self.incinerate(cur, post_id, user_id)

            self.conn.commit()
            cur.close()

        except Exception as e:
            logger.error(f"Error during scan cycle: {e}")
            self.conn.rollback()

    def incinerate(self, cur, post_id, user_id):
        """
        Performs the 'Burn':
        1. Updates 'burned_at' timestamp.
        2. Redacts content (The Scar).
        3. Removes media links.
        """
        burn_query = """
            UPDATE posts 
            SET 
                burned_at = NOW(),
                content = '🔥 [ASHES] This content has burned away.',
                media_url = NULL,
                title = '[BURNED]' -- Warning: 'title' column might not exist in schema.ts, handled via try/catch in real runtime or schema update.
            WHERE id = %s;
        """
        # Note: Checked schema.ts, 'title' does NOT exist on posts table. 
        # I will remove 'title' update to prevent SQL errors based on my knowledge of schema.ts.
        
        burn_query_adjusted = """
            UPDATE posts 
            SET 
                burned_at = NOW(),
                content = '🔥 [ASHES] This content has burned away.',
                media_url = NULL
            WHERE id = %s;
        """
        
        cur.execute(burn_query_adjusted, (post_id,))
        logger.info(f"🔥 INCINERATED Post {post_id} (User: {user_id})")

    def run(self):
        logger.info("Executioner Bee is active. Watching the timeline...")
        while self.running:
            self.scan_and_burn()
            # Pulse interval (check every 5 seconds)
            time.sleep(5)

if __name__ == "__main__":
    bee = BurnerBee()
    bee.run()
