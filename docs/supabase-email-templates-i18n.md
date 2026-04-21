# Supabase Email Templates FR/EN

Configure these templates in Supabase dashboard (`Authentication > Email Templates`) with both French and English variants.

## Confirm signup
- FR subject: `Confirmez votre compte Bento Resto`
- EN subject: `Confirm your Bento Resto account`

## Magic link
- FR subject: `Votre lien de connexion Bento Resto`
- EN subject: `Your Bento Resto sign-in link`

## Reset password
- FR subject: `Réinitialisez votre mot de passe Bento Resto`
- EN subject: `Reset your Bento Resto password`

Recommended approach:
1. Detect locale from user profile metadata (`preferred_locale`) when available.
2. Fallback to `fr`.
3. Keep callback URLs compatible with localized UI pages.
