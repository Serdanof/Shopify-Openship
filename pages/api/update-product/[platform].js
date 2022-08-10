import { gql, GraphQLClient } from "graphql-request";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res
      .status(400)
      .json({ error: "Update product endpoint for platform not found" });
  }

  try {
    const { error, updatedVariant } = await transformer[platform](req, res);

    if (error) {
      return res.status(400).json({ error });
    } else {
      return res.status(200).json({
        updatedVariant,
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: `${platform} update product endpoint failed, please try again.`,
    });
  }
};

export default handler;

const transformer = {
  shopify: async (req, res) => {
    const shopifyClient = new GraphQLClient(
      `https://${req.body.domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.body.accessToken,
        },
      }
    );

    const { productVariantUpdate } = await shopifyClient.request(
      gql`
        mutation ($input: ProductVariantInput!) {
          productVariantUpdate(input: $input) {
            productVariant {
              price
            }
          }
        }
      `,
      {
        input: {
          id: `gid://shopify/ProductVariant/${req.body.variantId}`,
          price: req.body.price,
          compareAtPrice: Math.ceil(Number(req.body.price) * 1.7) - 0.01,
        },
      }
    );

    return { updatedVariant: productVariantUpdate.productVariant };
  },
};
