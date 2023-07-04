import { OutboxMessage } from "../sourceConnector"

/** 
 * Represent a policy to determine to save the resume token or not
 */
export type ResumeTokenSavePolicy = (messageCount: number, message: OutboxMessage) => boolean

export namespace ResumeTokenSavePolicy {

    /**
     * A token resume save policy based on count of processed message
     * @param times Times before save the token
     * @returns 
     */
    export function every(times: number): ResumeTokenSavePolicy {
        return (count, _) => count % times == 0
    }
}