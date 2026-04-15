import 'dotenv/config'
import app from './app'
import { logger } from './lib/logger'

const PORT = process.env.PORT ?? 4000

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`)
})
