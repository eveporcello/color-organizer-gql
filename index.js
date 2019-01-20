const { ApolloServer, gql } = require("apollo-server");
const { generate } = require("shortid");
const { GraphQLScalarType } = require("graphql");
const isColor = require("is-color");
const Color = require("color");

let colors = require("./data.json");

const typeDefs = gql`
  scalar ColorValue

  type Color {
    id: ID!
    title: String!
    color: ColorValue!
    rating: Int
    timestamp: String!
  }

  type Query {
    allColors: [Color!]!
    color(id: ID!): Color
    totalColors: Int
  }

  type Mutation {
    addColor(title: String!, color: ColorValue!): Color
    rateColor(id: ID!, rating: Int!): Color
    removeColor(id: ID!): Color
  }
`;

const resolvers = {
  Query: {
    allColors: () => colors,
    color: (parent, { id }) => colors.find(color => color.id === id),
    totalColors: () => colors.length
  },
  Mutation: {
    addColor: (parent, { title, color }) => {
      let newColor = {
        id: generate(),
        timestamp: new Date().toISOString(),
        rating: 0,
        title,
        color
      };
      colors = [...colors, newColor];
      return newColor;
    },
    rateColor: (parent, { id, rating }) => {
      let colorToRate = colors.find(color => color.id === id);
      colorToRate.rating = rating;
      return colorToRate;
    },
    removeColor: (parent, { id }) => {
      let removedColor = colors.find(color => color.id === id);
      let newColors = colors.filter(color => color.id !== id);
      colors = newColors;
      return removedColor;
    }
  },
  ColorValue: new GraphQLScalarType({
    name: "ColorValue",
    description: "A color.",
    parseValue: value =>
      isColor(value)
        ? Color(value).hex()
        : new Error(`invalid hex color value: ${value}`),
    serialize: value => Color(value).hex(),
    parseLiteral: ast => {
      if (!isColor(ast.value)) {
        throw new Error(`invalid hex color value: ${ast.value}`);
      }
      return Color(ast.value).hex();
    }
  })
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.listen().then(({ url }) => console.log(`Server Running on ${url}`));
