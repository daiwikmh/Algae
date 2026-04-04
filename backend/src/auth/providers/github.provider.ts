import axios from 'axios'
import DOMPurify from 'isomorphic-dompurify'
import  { IOAuthProvider, ProviderConfig, IUser, IOAuthTokens } from '../types/provider'

export class GitHubProvider implements IOAuthProvider {
    providerName = 'github'

    private readonly authUrl = 'https://github.com/login/oauth/authorize'
    private readonly tokenUrl = 'https://github.com/login/oauth/access_token'
    private readonly profileUrl = 'https://api.github.com/user'
    private readonly emailsUrl = 'https://api.github.com/user/emails'

    constructor(private readonly config: ProviderConfig) { }

    getAuthUrl(state: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scope ?? 'read:user user:email',
            state,
        })
        return `${this.authUrl}?${params.toString()}`
    }

    async exchangeCodeForToken(code: string): Promise<IOAuthTokens> {
        const res = await axios.post(
            this.tokenUrl,
            {
                code,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri: this.config.redirectUri,
            },
            { headers: { Accept: 'application/json' } }
        )

        const data = res.data
        if (!data.access_token) throw new Error('No access token from GitHub')

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            scope: data.scope,
            expiresAt: data.expires_in
                ? new Date(Date.now() + data.expires_in * 1000)
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
    }
    async getUserProfile(accessToken: string): Promise<IUser> {
        const res = await axios.get(this.profileUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: this.config.timeoutMs ?? 10000,
        })

        const profile = res.data
        if (!profile?.id) throw new Error('GitHub profile ID missing')

        let email = profile.email ?? ''

        if (!email) {
            try {
                const emailRes = await axios.get(this.emailsUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                })
                const primary = emailRes.data.find(
                    (e: { email: string; primary: boolean; verified: boolean }) =>
                        e.primary && e.verified
                )
                email = primary?.email ?? ''
            } catch {
            }
        }

        return {
            id: DOMPurify.sanitize(profile.id.toString()),
            providerId: DOMPurify.sanitize(profile.id.toString()),
            email: DOMPurify.sanitize(email),
            name: DOMPurify.sanitize(profile.name ?? profile.login ?? ''),
            avatarUrl: profile.avatar_url ?? '',
            rawProfile: profile,
        }
    }
}