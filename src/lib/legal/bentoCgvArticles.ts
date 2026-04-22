/**
 * CGV — Bento Resto (SaaS vitrine & commande en ligne pour commerçants).
 * Texte à faire valider par un conseil juridique avant engagement contractuel fort.
 */

export const BENTO_CGV_EFFECTIVE_DATE_FR = "22 avril 2026";
export const BENTO_CGV_EFFECTIVE_DATE_EN = "22 April 2026";

export type CgvArticle = {
  id: string;
  title: { fr: string; en: string };
  paragraphs: { fr: string[]; en: string[] };
};

export const bentoCgvArticles: CgvArticle[] = [
  {
    id: "identification",
    title: {
      fr: "Article 1 — Identification du vendeur",
      en: "Article 1 — Seller identification",
    },
    paragraphs: {
      fr: [
        "Les présentes Conditions Générales de Vente (CGV) s'appliquent aux prestations logicielles et au service d'accès à la plateforme **Bento Resto** (ci-après le « Service »), fournis par :",
        "**Mehdi Monteyremard**, micro-entrepreneur immatriculé sous le numéro SIRET **850 270 802 00026**, dont le siège est situé au **3 avenue du Docteur Bonnet, 26100 Romans-sur-Isère**, France.",
        "**Contact :** mmonteyremard@gmail.com — +33 (0)6 69 35 02 81.",
        "**Numéro de TVA intracommunautaire :** FR23850270802 (le cas échéant selon la réglementation applicable aux opérations réalisées). Pour les prestations relevant du régime de la franchise en base de TVA (article 293 B du CGI), les prix sont communiqués **hors TVA** lorsque cette mention est indiquée sur le devis ou sur le Site.",
      ],
      en: [
        "These General Terms of Sale (GTS) apply to software-related services and access to the **Bento Resto** platform (the “Service”), provided by:",
        "**Mehdi Monteyremard**, sole trader (micro-entrepreneur) registered under SIRET **850 270 802 00026**, registered office at **3 avenue du Docteur Bonnet, 26100 Romans-sur-Isère**, France.",
        "**Contact:** mmonteyremard@gmail.com — +33 (0)6 69 35 02 81.",
        "**EU VAT number:** FR23850270802 (where applicable under the rules governing your transactions). Where the VAT exemption scheme for small businesses applies (French CGI art. 293 B), prices are stated **excluding VAT** when indicated on a quote or on the Site.",
      ],
    },
  },
  {
    id: "champ",
    title: {
      fr: "Article 2 — Objet et champ d'application",
      en: "Article 2 — Purpose and scope",
    },
    paragraphs: {
      fr: [
        "Les CGV définissent les conditions commerciales de vente du **droit d'accès et d'utilisation** du Service Bento Resto par les **commerçants professionnels ou non professionnels** qui ouvrent un compte (le « Client »).",
        "Les **Conditions d'utilisation** (CGU), accessibles sur le Site, complètent les présentes CGV pour les règles d'usage techniques, de sécurité et de comportement sur la plateforme.",
        "Les **ventes de biens ou prestations alimentaires** réalisées via les vitrines publiques hébergées par le Service sont conclues **entre le Client (commerçant) et le consommateur ou client final**. Le présent document ne constitue pas les CGV du commerçant vis-à-vis de ses propres clients ; le commerçant reste seul responsable de ses obligations légales et commerciales à leur égard.",
        "Les **prestations intellectuelles sur devis** (création graphique, développement sur mesure, audit, etc.) demeurent régies, le cas échéant, par un **devis et conditions** distincts acceptés par écrit, qui prévalent sur les présentes pour ces opérations spécifiques.",
      ],
      en: [
        "These GTS set out the commercial terms for selling the **right to access and use** the Bento Resto Service to **merchants** who create an account (the “Customer”).",
        "The **Terms of Service**, available on the Site, supplement these GTS with technical, security and acceptable-use rules.",
        "**Sales of food or related goods/services** made through public storefronts hosted on the Service are entered into **between the Customer (merchant) and the end consumer or buyer**. This document is not the merchant's own terms of sale towards their customers; the merchant remains solely responsible for their legal and commercial obligations towards them.",
        "**Bespoke professional services** (design, custom development, audits, etc.), where applicable, are governed by a **separate quote and terms** accepted in writing, which prevail over these GTS for those specific engagements.",
      ],
    },
  },
  {
    id: "services",
    title: {
      fr: "Article 3 — Description des services",
      en: "Article 3 — Description of services",
    },
    paragraphs: {
      fr: [
        "Bento Resto est une solution logicielle en mode **SaaS** permettant notamment : la publication d'une **vitrine digitale** (menu, produits, formules), la **prise de commande en ligne**, l'usage d'outils de gestion associés (tableau de bord marchand, commandes), et l'intégration technique de **paiement en ligne** via **Stripe** lorsque le commerçant configure son compte conformément aux prérequis du Service.",
        "Les fonctionnalités effectivement disponibles peuvent évoluer ; une description à jour est présentée sur le **Site** (pages marketing, documentation ou interface). Le Service est fourni **par l'Internet** ; le Client doit disposer d'un équipement et d'une connexion adaptés.",
      ],
      en: [
        "Bento Resto is **SaaS** software that enables in particular: a **digital storefront** (menu, products, bundles), **online ordering**, related merchant tools (dashboard, orders), and **online payment** integration through **Stripe** when the merchant configures their account according to the Service requirements.",
        "Available features may change; an up-to-date description is provided on the **Site** (marketing pages, documentation or in-app UI). The Service is delivered **over the Internet**; the Customer must have suitable equipment and connectivity.",
      ],
    },
  },
  {
    id: "commande",
    title: {
      fr: "Article 4 — Commande et acceptation des CGV",
      en: "Article 4 — Order and acceptance of the GTS",
    },
    paragraphs: {
      fr: [
        "Toute souscription ou utilisation payante du Service, ou à défaut toute **création de compte** et utilisation du Service dans les conditions prévues sur le Site, vaut **acceptation pleine et entière** des présentes CGV et des CGU en vigueur à la date d'acceptation.",
        "Le Client garantit disposer de la **capacité juridique** pour contracter et, le cas échéant, être habilité à engager la structure (personne morale, association, etc.) qu'il représente.",
      ],
      en: [
        "Any paid subscription to the Service, or where applicable **account creation** and use of the Service as offered on the Site, constitutes **full and unreserved acceptance** of these GTS and of the Terms of Service in force at the time of acceptance.",
        "The Customer warrants that they have **legal capacity** to contract and, where relevant, authority to bind the organisation they represent.",
      ],
    },
  },
  {
    id: "tarifs",
    title: {
      fr: "Article 5 — Tarifs",
      en: "Article 5 — Pricing",
    },
    paragraphs: {
      fr: [
        "Les tarifs applicables au Service (offres gratuites, abonnements, options ou prestations complémentaires facturées via la plateforme) sont ceux **affichés sur le Site** ou communiqués par tout moyen écrit (e-mail, espace client) au moment de la commande.",
        "Les prix sont exprimés en **euros**. Sauf mention contraire expresse, les prix professionnels hors TVA au sens de l'article 293 B du CGI sont indiqués comme tels ; toute évolution légale ou tarifaire applicable sera communiquée dans des conditions raisonnables avant facturation lorsque la loi l'exige.",
        "Le Prestataire se réserve le droit de **modifier ses tarifs** ; les nouveaux tarifs s'appliquent aux **nouvelles périodes** de facturation ou renouvellements après information du Client sur le Site ou par e-mail.",
      ],
      en: [
        "Applicable fees for the Service (free tiers, subscriptions, add-ons or ancillary services billed through the platform) are those **displayed on the Site** or sent in writing (email, customer area) at the time of order.",
        "Prices are in **euros**. Unless clearly stated otherwise, B2B prices excluding VAT under French CGI art. 293 B are labelled as such; any legal or pricing change will be communicated in a reasonable manner before billing where required by law.",
        "The provider may **change its prices**; new prices apply to **new billing periods** or renewals after notice on the Site or by email.",
      ],
    },
  },
  {
    id: "paiement",
    title: {
      fr: "Article 6 — Facturation et paiement (Service Bento)",
      en: "Article 6 — Billing and payment (Bento Service)",
    },
    paragraphs: {
      fr: [
        "Lorsque le Service comporte des sommes dues au Prestataire, le paiement s'effectue selon les **moyens proposés sur le Site** (carte bancaire, prélèvement ou tout autre canal mis en œuvre). Les factures ou reçus sont adressés aux coordonnées du compte Client.",
        "En cas de **défaut de paiement** non régularisé dans un délai de quinze (15) jours après mise en demeure, le Prestataire pourra suspendre l'accès au Service puis résilier le compte, sans préjudice de sommes dues.",
        "Les **paiements des clients finaux** effectués depuis une vitrine (Stripe Checkout) sont réglés selon les **conditions Stripe** et la configuration du compte du commerçant ; ils ne constituent pas un encaissement par le Prestataire au titre des ventes du commerçant, sauf configuration ou produit expressément prévu autrement sur le Site.",
      ],
      en: [
        "Where fees are payable to the provider, payment is made using the **methods offered on the Site** (card, direct debit or any other channel enabled). Invoices or receipts are sent to the Customer account contact details.",
        "In the event of **unpaid amounts** not settled within fifteen (15) days after formal notice, the provider may suspend access to the Service and then close the account, without prejudice to amounts due.",
        "**End-customer payments** made from a storefront (Stripe Checkout) are processed under **Stripe's terms** and the merchant's account configuration; they do not constitute the provider collecting the merchant's sales proceeds, unless another arrangement is expressly stated on the Site.",
      ],
    },
  },
  {
    id: "duree",
    title: {
      fr: "Article 7 — Durée, suspension et résiliation",
      en: "Article 7 — Term, suspension and termination",
    },
    paragraphs: {
      fr: [
        "Le Service est fourni pour la **durée** prévue par l'offre souscrite (formule gratuite, abonnement mensuel ou annuel, etc.). À défaut de durée fixe, le contrat est conclu pour une durée indéterminée et chaque partie peut le résilier avec un **préavis raisonnable** communiqué par e-mail, sauf disposition contraire sur le Site.",
        "Le Prestataire peut **suspendre** l'accès au Service en cas de violation des CGU, de risque de sécurité, d'impayé ou d'obligation légale.",
        "À la résiliation, l'accès au Service cesse ; le Client est invité à **exporter** ses contenus (catalogue, paramètres) avant clôture lorsque l'interface le permet. Les données sont traitées conformément à la **Politique de confidentialité**.",
      ],
      en: [
        "The Service is provided for the **term** of the selected plan (free tier, monthly or yearly subscription, etc.). Where no fixed term applies, the agreement runs for an **indefinite term** and either party may terminate with **reasonable notice** by email, unless otherwise stated on the Site.",
        "The provider may **suspend** access in case of breach of the Terms of Service, security risk, non-payment or legal obligation.",
        "On termination, access ends; the Customer should **export** their content (catalogue, settings) before closure where the UI allows. Data is processed as described in the **Privacy Policy**.",
      ],
    },
  },
  {
    id: "clients-finaux",
    title: {
      fr: "Article 8 — Commandes des clients finaux sur les vitrines",
      en: "Article 8 — End-customer orders on storefronts",
    },
    paragraphs: {
      fr: [
        "Les commandes passées par les utilisateurs sur l'URL publique d'un commerçant constituent un **contrat de vente** entre ce commerçant et l'acheteur. Le Prestataire fournit un **outil technique** d'affichage, de panier et de redirection vers le prestataire de paiement.",
        "Les obligations relatives aux **prix TTC**, allergènes, disponibilité des produits, droit de rétractation ou délais de livraison/retrait, garanties légales et réclamations **incombent au commerçant**, qui publie les informations sur sa vitrine et applique sa politique commerciale.",
        "Pour toute réclamation portant sur une commande alimentaire ou un produit vendu par un commerçant, le Client final doit s'adresser **en priorité au commerçant** concerné.",
      ],
      en: [
        "Orders placed by users on a merchant's public URL form a **sales contract** between that merchant and the buyer. The provider supplies a **technical tool** for display, cart and redirection to the payment processor.",
        "Obligations regarding **VAT-inclusive pricing**, allergens, product availability, **withdrawal rights** or delivery/collection times, legal warranties and claims **rest with the merchant**, who publishes information on their storefront and applies their own commercial policy.",
        "For any claim about a food order or product sold by a merchant, the end customer should contact the **merchant first**.",
      ],
    },
  },
  {
    id: "obligations-client",
    title: {
      fr: "Article 9 — Obligations du Client (commerçant)",
      en: "Article 9 — Customer (merchant) obligations",
    },
    paragraphs: {
      fr: [
        "Le Client fournit des informations **exactes et à jour**, maintient la confidentialité de ses identifiants, et utilise le Service conformément aux lois et règlements (dont droit de la consommation, propriété intellectuelle, données personnelles de ses propres clients).",
        "Le Client est seul responsable du **contenu** publié (textes, images, prix), de la conformité de son activité et de ses obligations fiscales et sociales (dont TVA, caisse enregistreuse si applicable).",
      ],
      en: [
        "The Customer provides **accurate, up-to-date information**, keeps credentials confidential, and uses the Service in compliance with applicable laws (including consumer law, intellectual property, and personal data of their own customers).",
        "The Customer is solely responsible for **published content** (texts, images, prices), for compliance of their business and for their tax and social obligations (including VAT, record-keeping where applicable).",
      ],
    },
  },
  {
    id: "obligations-prestataire",
    title: {
      fr: "Article 10 — Obligations du Prestataire",
      en: "Article 10 — Provider obligations",
    },
    paragraphs: {
      fr: [
        "Le Prestataire met en œuvre des moyens raisonnables pour assurer le **fonctionnement** du Service et sa **disponibilité**, sous réserve des opérations de maintenance, des dépendances techniques (hébergement, APIs tierces dont Stripe) et des cas de force majeure au sens du droit français.",
        "Sauf mention expresse d'un niveau de service (**SLA**) contractuel et payant, aucune **garantie de résultat** ni de disponibilité permanente n'est due.",
      ],
      en: [
        "The provider uses reasonable efforts to keep the Service **running** and **available**, subject to maintenance, technical dependencies (hosting, third-party APIs including Stripe) and **force majeure** under French law.",
        "Unless an express paid **SLA** is agreed, no **performance guarantee** or permanent uptime is owed.",
      ],
    },
  },
  {
    id: "pi",
    title: {
      fr: "Article 11 — Propriété intellectuelle",
      en: "Article 11 — Intellectual property",
    },
    paragraphs: {
      fr: [
        "Les éléments du Service (logiciel, marque **Bento Resto**, documentation) restent la **propriété exclusive** du Prestataire. Le Client bénéficie d'un **droit d'utilisation** personnel, non exclusif, non transférable, pour la durée du contrat, dans la limite des fonctionnalités souscrites.",
        "Les contenus créés par le Client (fiches produits, visuels fournis par le Client) restent la propriété du Client ; le Client concède au Prestataire une **licence d'hébergement et d'affichage** strictement nécessaire à l'exécution du Service.",
      ],
      en: [
        "Service components (software, **Bento Resto** brand, documentation) remain the **exclusive property** of the provider. The Customer receives a **personal, non-exclusive, non-transferable licence** for the term of the agreement, within the subscribed features.",
        "Content created by the Customer (product listings, images supplied by the Customer) remains the Customer's property; the Customer grants the provider a **hosting and display licence** strictly necessary to run the Service.",
      ],
    },
  },
  {
    id: "responsabilite",
    title: {
      fr: "Article 12 — Responsabilité",
      en: "Article 12 — Liability",
    },
    paragraphs: {
      fr: [
        "Le Prestataire n'est pas responsable des **dommages indirects** (perte de chiffre d'affaires, perte de données non imputable à une faute lourde, préjudice commercial) liés à l'utilisation ou à l'impossibilité d'utiliser le Service.",
        "Sauf faute lourde ou dol, et dans les limites légales, la responsabilité du Prestataire est **limitée** au montant total payé par le Client au titre du Service sur les **douze (12) mois** précédant le fait générateur de responsabilité.",
      ],
      en: [
        "The provider is not liable for **indirect damages** (loss of revenue, data loss not due to gross negligence, commercial loss) related to use or inability to use the Service.",
        "Except in cases of gross negligence or wilful misconduct, and within legal limits, the provider's liability is **capped** at the total amount paid by the Customer for the Service in the **twelve (12) months** preceding the event giving rise to liability.",
      ],
    },
  },
  {
    id: "donnees",
    title: {
      fr: "Article 13 — Données personnelles et cookies",
      en: "Article 13 — Personal data and cookies",
    },
    paragraphs: {
      fr: [
        "Les traitements de données réalisés dans le cadre du Service sont décrits dans la **Politique de confidentialité** (/privacy). Les traceurs et préférences sont gérés conformément aux règles affichées sur le **bandeau cookies** et à la page **Politique cookies** (/cookies) lorsque celle-ci est disponible.",
      ],
      en: [
        "Data processing in connection with the Service is described in the **Privacy Policy** (/privacy). Cookies and preferences are managed as stated in the **cookie banner** and the **Cookie Policy** (/cookies) when available.",
      ],
    },
  },
  {
    id: "modification",
    title: {
      fr: "Article 14 — Modification des CGV",
      en: "Article 14 — Changes to the GTS",
    },
    paragraphs: {
      fr: [
        "Le Prestataire peut adapter les présentes CGV pour tenir compte d'évolutions légales, techniques ou économiques. La **date de mise à jour** figure en tête du document. Lorsque la loi l'exige, le Client sera informé et, le cas échéant, invité à **accepter** les nouvelles conditions pour poursuivre l'usage du Service.",
      ],
      en: [
        "The provider may update these GTS to reflect legal, technical or economic changes. The **last updated date** appears at the top of the document. Where required by law, the Customer will be informed and, if applicable, asked to **accept** the new terms to continue using the Service.",
      ],
    },
  },
  {
    id: "droit-applicable",
    title: {
      fr: "Article 15 — Droit applicable et juridiction compétente",
      en: "Article 15 — Governing law and jurisdiction",
    },
    paragraphs: {
      fr: [
        "Les présentes CGV sont régies par le **droit français**.",
        "En l'absence de règlement amiable dans un délai de trente (30) jours, tout litige relatif à leur interprétation ou à leur exécution relève de la **compétence des tribunaux français**, et à défaut de règle spécifique, des tribunaux du ressort du **siège social du Prestataire**.",
      ],
      en: [
        "These GTS are governed by **French law**.",
        "If no amicable settlement is reached within thirty (30) days, any dispute relating to their interpretation or performance shall fall under the **jurisdiction of the French courts**, and failing a specific rule, the courts with jurisdiction over the **provider's registered office**.",
      ],
    },
  },
  {
    id: "mediation",
    title: {
      fr: "Article 16 — Médiation et plateforme européenne (consommation)",
      en: "Article 16 — Mediation and EU platform (consumers)",
    },
    paragraphs: {
      fr: [
        "Lorsque le Client agit en **qualité de consommateur** au sens du Code de la consommation et que la réglementation applicable impose un dispositif de médiation, les informations relatives au **médiateur** désigné et les modalités de saisine seront communiquées sur le Site ou sur demande auprès du contact indiqué à l'article 1.",
        "Conformément au **règlement (UE) n°524/2013**, la Commission européenne met à disposition une plateforme de règlement en ligne des litiges accessible à l'adresse suivante : https://ec.europa.eu/consumers/odr/ — ce lien est fourni à titre informatif pour les litiges de consommation **éligibles** ; les litiges relatifs aux commandes passées chez un commerçant via une vitrine relèvent en premier lieu du commerçant concerné.",
      ],
      en: [
        "Where the Customer acts as a **consumer** within the meaning of French consumer law and mediation is legally required, information about the appointed **mediator** and how to refer a dispute will be provided on the Site or on request to the contact in Article 1.",
        "Under **EU Regulation No 524/2013**, the European Commission provides an online dispute resolution platform at: https://ec.europa.eu/consumers/odr/ — this link is for information on **eligible** consumer disputes; disputes about orders placed with a merchant via a storefront should first be addressed to that merchant.",
      ],
    },
  },
];
